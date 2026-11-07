const db = require('../../../config/db');
const escalationRules = {
  escalateWhenUnresolved: true,
  escalateWhenHumanHelpRequested: true,
};

const riskWeights = {
  sentiment: 30,
  sla: 40,
  reopenCount: 30,
};

const sentimentRisk = {
  POSITIVE: 0,
  NEUTRAL: 15,
  NEGATIVE: 30,
};

const calculateSlaRisk = (minutes) => {
  if (minutes <= 0) return 40;
  if (minutes <= 15) return 35;
  if (minutes <= 60) return 25;
  if (minutes <= 240) return 15;
  return 0;
};

const calculateReopenRisk = (count) => {
  if (count >= 2) return 30;
  if (count === 1) return 15;
  return 0;
};

const analyzeEscalationRisk = async (requestData) => {
  if (
    !requestData ||
    typeof requestData !== 'object' ||
    Array.isArray(requestData)
  ) {
    throw new Error('Risk analysis data is required');
  }

  const {
    summary,
    description,
    slaTimeLeft,
    reopenCount,
  } = requestData;

  if (typeof summary !== 'string' || !summary.trim()) {
    throw new Error('Ticket summary is required');
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== 'string'
  ) {
    throw new Error('Ticket description must be a string');
  }

  if (!Number.isInteger(slaTimeLeft)) {
    throw new Error('slaTimeLeft must be an integer in minutes');
  }

  const hasReopenCount =
    reopenCount !== undefined && reopenCount !== null;

  if (
    hasReopenCount &&
    (!Number.isInteger(reopenCount) || reopenCount < 0)
  ) {
    throw new Error('reopenCount must be a non-negative integer');
  }

  const sentimentText = [
    summary.trim(),
    description?.trim() || '',
  ].filter(Boolean).join('\n');

  const sentimentResult = await classifyTicketSentiment(sentimentText);
  const sentiment = sentimentResult.sentiment;

  const sentimentPoints = sentimentRisk[sentiment];
  const slaPoints = calculateSlaRisk(slaTimeLeft);

  const reopenPoints = hasReopenCount
    ? calculateReopenRisk(reopenCount)
    : 0;

  const availableWeight =
    riskWeights.sentiment +
    riskWeights.sla +
    (hasReopenCount ? riskWeights.reopenCount : 0);

  const totalPoints =
    sentimentPoints + slaPoints + reopenPoints;

  const riskScore = Math.round(
    (totalPoints / availableWeight) * 100
  );

  const riskLevel =
    riskScore >= 60
      ? 'HIGH'
      : riskScore >= 35
        ? 'MEDIUM'
        : 'LOW';

  const missingSignals = hasReopenCount
    ? []
    : ['reopenCount'];

  const recommendTier2 =
    riskLevel === 'HIGH' && availableWeight >= 70;

  const reasons = [];

  if (sentiment === 'NEGATIVE') {
    reasons.push('Negative ticket sentiment');
  }

  if (sentiment === 'NEUTRAL') {
    reasons.push('Neutral ticket sentiment');
  }

  if (slaTimeLeft <= 0) {
    reasons.push('SLA has already been breached');
  } else if (slaTimeLeft <= 15) {
    reasons.push('SLA breach is imminent');
  } else if (slaTimeLeft <= 60) {
    reasons.push('SLA time is running low');
  } else if (slaTimeLeft <= 240) {
    reasons.push('SLA requires monitoring');
  }

  if (hasReopenCount && reopenCount > 0) {
    reasons.push(`Ticket has been reopened ${reopenCount} time(s)`);
  }

  if (!hasReopenCount) {
    reasons.push('Reopen count is unavailable');
  }

  return {
    riskScore,
    riskLevel,
    recommendation: recommendTier2
      ? 'ESCALATE_TO_TIER_2'
      : 'CONTINUE_MONITORING',
    dataCompletenessPercentage: availableWeight,
    missingSignals,
    reasons,
    signals: {
      sentiment: {
        value: sentiment,
        confidence: sentimentResult.confidence,
        modelLabel: sentimentResult.modelLabel,
        starRating: sentimentResult.starRating,
        riskPoints: sentimentPoints,
        maximumPoints: riskWeights.sentiment,
      },
      sla: {
        minutesRemaining: slaTimeLeft,
        riskPoints: slaPoints,
        maximumPoints: riskWeights.sla,
      },
      reopenCount: {
        value: hasReopenCount ? reopenCount : null,
        riskPoints: reopenPoints,
        maximumPoints: riskWeights.reopenCount,
        available: hasReopenCount,
      },
    },
  };
};

const evaluateEscalation = async (requestData) => {
  const {
    resolved,
    humanHelpRequested = false,
  } = requestData;

  if (resolved === true) {
    return {
      escalate: false,
      decision: 'RESOLVED',
      reason: 'AI resolved the issue',
    };
  }

  if (
    humanHelpRequested === true &&
    escalationRules.escalateWhenHumanHelpRequested
  ) {
    return {
      escalate: true,
      decision: 'ESCALATE',
      reason: 'User requested human assistance',
    };
  }

  if (
    resolved === false &&
    escalationRules.escalateWhenUnresolved
  ) {
    return {
      escalate: true,
      decision: 'ESCALATE',
      reason: 'AI could not resolve the issue',
    };
  }

  return {
    escalate: false,
    decision: 'NO_ACTION',
    reason: 'No escalation condition matched',
  };
};

const createEscalationHandoff = async (requestData) => {
  return {
    handoff: true,
    ticketCreationRequested: true,
    actorId: requestData.actorId,
    requesterId: requestData.requesterId,
    userId: requestData.requesterId,
    request: {
      userId: requestData.requesterId,
      summary: requestData.summary,
      conversationId: requestData.conversationId || null,
      reason: requestData.reason,
    },
    status: 'READY_FOR_TICKET_CREATION',
  };
};

const SENTIMENT_MODEL =
  'Xenova/bert-base-multilingual-uncased-sentiment';

let sentimentClassifierPromise = null;

const getSentimentClassifier = async () => {
  if (!sentimentClassifierPromise) {
    sentimentClassifierPromise = (async () => {
      const { pipeline } = await import('@xenova/transformers');

      return pipeline('sentiment-analysis', SENTIMENT_MODEL);
    })();
  }

  try {
    return await sentimentClassifierPromise;
  } catch (error) {
    sentimentClassifierPromise = null;
    throw error;
  }
};

const classifyTicketSentiment = async (text) => {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Ticket summary or description is required');
  }

  let predictions;

  try {
    const classifier = await getSentimentClassifier();
    predictions = await classifier(text.trim());
  } catch (error) {
    const modelError = new Error(
      'Sentiment analysis is temporarily unavailable'
    );
    modelError.code = 'SENTIMENT_MODEL_UNAVAILABLE';
    modelError.cause = error;
    throw modelError;
  }

  const prediction = predictions[0];
  const match = prediction?.label?.match(/^([1-5]) stars?$/i);

  if (!match) {
    throw new Error('Unsupported sentiment model output');
  }

  const stars = Number(match[1]);

  return {
    sentiment:
      stars <= 2 ? 'NEGATIVE' :
      stars === 3 ? 'NEUTRAL' :
      'POSITIVE',
    confidence: Number(prediction.score.toFixed(4)),
    modelLabel: prediction.label,
    starRating: stars,
  };
};

const getTicketForEscalation = async (
  ticketId,
  organisationId = null
) => {
  if (typeof ticketId !== 'string' || !ticketId.trim()) {
    throw new Error('Valid ticket ID is required');
  }

  return db.ticket.findFirst({
    where: {
      id: ticketId.trim(),
      ...(organisationId ? { organisationId } : {}),
    },
    select: {
      id: true,
      summary: true,
      description: true,
      slaTimeLeft: true,
      organisationId: true,
      requesterId: true,
    },
  });
};

module.exports = {
  getTicketForEscalation,
  evaluateEscalation,
  createEscalationHandoff,
  analyzeEscalationRisk,
};
