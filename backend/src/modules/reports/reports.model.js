'use strict';

const db = require('../../config/db');

const useMockData = process.env.NODE_ENV === 'test';
const allowOfflineMocks = process.env.ALLOW_OFFLINE_MOCKS === 'true';

const getSlaComplianceData = async (organisationId = null, options = {}) => {
  const { priority } = options;

  if (useMockData) {
    const { getIncidents } = require('../incidents/incidents.model');
    const mockList = await getIncidents(organisationId ? { organisationId } : {});

    const filtered = mockList.filter((t) => {
      if (priority && t.priority !== priority) return false;
      return true;
    });

    const totalTickets = filtered.length;
    const breachedCount = filtered.filter((t) => (t.slaTimeLeft || 0) <= 0).length;
    const metCount = totalTickets - breachedCount;
    const complianceRate = totalTickets > 0 ? Math.round((metCount / totalTickets) * 100) : 100;

    const priorities = ['Critical', 'High', 'Medium', 'Low'];
    const byPriority = priorities.map((p) => {
      const pTickets = filtered.filter((t) => t.priority === p);
      const pTotal = pTickets.length;
      const pBreached = pTickets.filter((t) => (t.slaTimeLeft || 0) <= 0).length;
      const pMet = pTotal - pBreached;
      return {
        priority: p,
        total: pTotal,
        met: pMet,
        breached: pBreached,
        complianceRate: pTotal > 0 ? Math.round((pMet / pTotal) * 100) : 100,
      };
    });

    return {
      totalTickets,
      metCount,
      breachedCount,
      complianceRate,
      byPriority,
      averageResolutionMinutes: 145,
    };
  }

  try {
    const where = {
      ...(organisationId ? { organisationId } : {}),
      ...(priority ? { priority } : {}),
    };

    const tickets = await db.ticket.findMany({
      where,
      select: {
        id: true,
        priority: true,
        status: true,
        slaTimeLeft: true,
        timeRecord: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 500,
    });

    const totalTickets = tickets.length;
    const breachedCount = tickets.filter((t) => (t.slaTimeLeft || 0) <= 0).length;
    const metCount = totalTickets - breachedCount;
    const complianceRate = totalTickets > 0 ? Math.round((metCount / totalTickets) * 100) : 100;

    const priorities = ['Critical', 'High', 'Medium', 'Low'];
    const byPriority = priorities.map((p) => {
      const pTickets = tickets.filter((t) => t.priority === p);
      const pTotal = pTickets.length;
      const pBreached = pTickets.filter((t) => (t.slaTimeLeft || 0) <= 0).length;
      const pMet = pTotal - pBreached;
      return {
        priority: p,
        total: pTotal,
        met: pMet,
        breached: pBreached,
        complianceRate: pTotal > 0 ? Math.round((pMet / pTotal) * 100) : 100,
      };
    });

    const resolved = tickets.filter((t) => ['Closed', 'Resolved'].includes(t.status));
    const avgMinutes = resolved.length
      ? Math.round(resolved.reduce((sum, t) => sum + (t.timeRecord || 60), 0) / resolved.length)
      : 120;

    return {
      totalTickets,
      metCount,
      breachedCount,
      complianceRate,
      byPriority,
      averageResolutionMinutes: avgMinutes,
    };
  } catch (err) {
    if (allowOfflineMocks) {
      return {
        totalTickets: 25,
        metCount: 22,
        breachedCount: 3,
        complianceRate: 88,
        byPriority: [],
        averageResolutionMinutes: 120,
      };
    }
    throw err;
  }
};

const getAgentPerformanceData = async (organisationId = null) => {
  if (useMockData) {
    const { getIncidents } = require('../incidents/incidents.model');
    const mockList = await getIncidents(organisationId ? { organisationId } : {});

    const agentsMap = {
      'agent-001': {
        agentId: 'agent-001',
        agentName: 'John Doe',
        email: 'john.doe@servigen.local',
        assignedTickets: 0,
        resolvedTickets: 0,
        slaComplianceRate: 100,
        totalHoursLogged: 8.5,
      },
      'agent-002': {
        agentId: 'agent-002',
        agentName: 'Jane Smith',
        email: 'jane.smith@servigen.local',
        assignedTickets: 0,
        resolvedTickets: 0,
        slaComplianceRate: 90,
        totalHoursLogged: 12.0,
      },
    };

    for (const t of mockList) {
      if (t.assignedAgentId && agentsMap[t.assignedAgentId]) {
        agentsMap[t.assignedAgentId].assignedTickets++;
        if (['Closed', 'Resolved'].includes(t.status)) {
          agentsMap[t.assignedAgentId].resolvedTickets++;
        }
      }
    }

    return Object.values(agentsMap);
  }

  try {
    const userWhere = {
      role: { in: ['Service Agent', 'Support Team User'] },
      ...(organisationId ? { organisationId } : {}),
    };

    const agents = await db.user.findMany({
      where: userWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      take: 100,
    });

    const performance = await Promise.all(
      agents.map(async (agent) => {
        const ticketWhere = {
          assignedAgentId: agent.id,
          ...(organisationId ? { organisationId } : {}),
        };

        const totalAssigned = await db.ticket.count({ where: ticketWhere });
        const resolved = await db.ticket.count({
          where: { ...ticketWhere, status: { in: ['Closed', 'Resolved'] } },
        });
        const breached = await db.ticket.count({
          where: { ...ticketWhere, slaTimeLeft: { lte: 0 } },
        });

        const timeEntries = await db.ticketTimeEntry.findMany({
          where: { agentId: agent.id },
          select: { durationMinutes: true },
        });
        const totalMinutes = timeEntries.reduce((sum, e) => sum + e.durationMinutes, 0);

        const met = totalAssigned - breached;
        const slaRate = totalAssigned > 0 ? Math.round((met / totalAssigned) * 100) : 100;

        return {
          agentId: agent.id,
          agentName: `${agent.firstName} ${agent.lastName || ''}`.trim(),
          email: agent.email,
          assignedTickets: totalAssigned,
          resolvedTickets: resolved,
          slaComplianceRate: slaRate,
          totalHoursLogged: Number((totalMinutes / 60).toFixed(1)),
        };
      })
    );

    return performance;
  } catch (err) {
    if (allowOfflineMocks) {
      return [
        {
          agentId: 'agent-001',
          agentName: 'John Doe',
          email: 'agent001@servigen.local',
          assignedTickets: 12,
          resolvedTickets: 10,
          slaComplianceRate: 92,
          totalHoursLogged: 14.5,
        },
      ];
    }
    throw err;
  }
};

const getExportableData = async (type = 'incidents', organisationId = null) => {
  if (useMockData) {
    const { getIncidents } = require('../incidents/incidents.model');
    const mockList = await getIncidents(organisationId ? { organisationId } : {});
    return mockList.map((t) => ({
      id: t.id,
      summary: t.summary,
      priority: t.priority,
      status: t.status,
      category: t.incident?.category || 'General',
      slaTimeLeft: t.slaTimeLeft,
      timeSpent: t.timeRecord || 0,
      createdAt: t.createdAt,
    }));
  }

  try {
    const where = organisationId ? { organisationId } : {};
    const tickets = await db.ticket.findMany({
      where,
      select: {
        id: true,
        summary: true,
        priority: true,
        status: true,
        slaTimeLeft: true,
        timeRecord: true,
        createdAt: true,
        incident: { select: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    return tickets.map((t) => ({
      id: t.id,
      summary: t.summary,
      priority: t.priority,
      status: t.status,
      category: t.incident?.category || 'General',
      slaTimeLeft: t.slaTimeLeft,
      timeSpent: t.timeRecord || 0,
      createdAt: t.createdAt.toISOString(),
    }));
  } catch (err) {
    if (allowOfflineMocks) {
      return [
        {
          id: 'INC-1001',
          summary: 'VPN Disconnection',
          priority: 'High',
          status: 'Active',
          category: 'Network',
          slaTimeLeft: 180,
          timeSpent: 45,
          createdAt: new Date().toISOString(),
        },
      ];
    }
    throw err;
  }
};

module.exports = {
  getSlaComplianceData,
  getAgentPerformanceData,
  getExportableData,
};
