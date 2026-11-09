'use strict';

const {
  getSlaComplianceData,
  getAgentPerformanceData,
  getExportableData,
} = require('./reports.model');
const AppError = require('../../shared/utils/app-error');
const { HTTP_STATUS } = require('../../shared/constants/http.constants');

const toCsv = (rows = []) => {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    let str = String(val);
    // CSV Formula Injection mitigation (CWE-1236)
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const lines = rows.map((row) => headers.map((h) => escapeCell(row[h])).join(','));
  return [headerLine, ...lines].join('\r\n');
};

const getSlaComplianceReport = async (organisationId = null, query = {}) => {
  const { timeframe = '30d', priority } = query;
  const data = await getSlaComplianceData(organisationId, { priority });
  return {
    timeframe,
    generatedAt: new Date().toISOString(),
    ...data,
  };
};

const getAgentPerformanceReport = async (organisationId = null, query = {}) => {
  const { timeframe = '30d' } = query;
  const agents = await getAgentPerformanceData(organisationId);
  return {
    timeframe,
    generatedAt: new Date().toISOString(),
    totalAgents: agents.length,
    agents,
  };
};

const generateExport = async (organisationId = null, query = {}) => {
  const { format = 'csv', type = 'incidents' } = query;

  const validFormats = ['csv', 'json', 'pdf'];
  if (!validFormats.includes(format.toLowerCase())) {
    throw new AppError(`Format must be one of: ${validFormats.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
  }

  const validTypes = ['incidents', 'sla', 'performance'];
  if (!validTypes.includes(type.toLowerCase())) {
    throw new AppError(`Type must be one of: ${validTypes.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
  }

  let data;
  if (type === 'sla') {
    const report = await getSlaComplianceData(organisationId);
    data = report.byPriority || [];
  } else if (type === 'performance') {
    data = await getAgentPerformanceData(organisationId);
  } else {
    data = await getExportableData(type, organisationId);
  }

  if (format.toLowerCase() === 'csv') {
    const csvContent = toCsv(data);
    return {
      format: 'csv',
      contentType: 'text/csv; charset=utf-8',
      filename: `servigen-${type}-report-${Date.now()}.csv`,
      content: csvContent,
    };
  }

  // JSON / structured report (suitable for client PDF generation)
  return {
    format: 'json',
    contentType: 'application/json',
    filename: `servigen-${type}-report-${Date.now()}.json`,
    content: {
      reportType: type,
      organisationId,
      generatedAt: new Date().toISOString(),
      rowCount: data.length,
      data,
    },
  };
};

module.exports = {
  toCsv,
  getSlaComplianceReport,
  getAgentPerformanceReport,
  generateExport,
};
