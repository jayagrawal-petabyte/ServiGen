'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const reportsService = require('./reports.service');

describe('Reporting & Analytics Service', () => {
  it('generates SLA compliance report scoped to organisation', async () => {
    const report = await reportsService.getSlaComplianceReport('org-001', { timeframe: '30d' });
    assert.equal(report.timeframe, '30d');
    assert.ok(typeof report.totalTickets === 'number');
    assert.ok(typeof report.complianceRate === 'number');
    assert.ok(Array.isArray(report.byPriority));
  });

  it('filters SLA compliance report by priority', async () => {
    const report = await reportsService.getSlaComplianceReport('org-001', { priority: 'Critical' });
    assert.ok(typeof report.complianceRate === 'number');
  });

  it('generates agent performance scorecard report', async () => {
    const report = await reportsService.getAgentPerformanceReport('org-001', { timeframe: '30d' });
    assert.ok(Array.isArray(report.agents));
    assert.ok(report.agents.length > 0);
    const first = report.agents[0];
    assert.ok(first.agentId);
    assert.ok(first.agentName);
    assert.ok(typeof first.slaComplianceRate === 'number');
    assert.ok(typeof first.totalHoursLogged === 'number');
  });

  it('generates RFC 4180 CSV export for incidents', async () => {
    const exportResult = await reportsService.generateExport('org-001', {
      format: 'csv',
      type: 'incidents',
    });
    assert.equal(exportResult.format, 'csv');
    assert.equal(exportResult.contentType, 'text/csv; charset=utf-8');
    assert.ok(exportResult.filename.endsWith('.csv'));
    assert.ok(exportResult.content.includes('id,summary,priority,status'));
  });

  it('escapes potential CSV formula injection payloads', () => {
    const csv = reportsService.toCsv([
      { name: '=1+1', command: '@SUM(A1:A2)', formula: '-5+2', normal: 'Safe text' },
    ]);
    assert.ok(csv.includes("'=1+1"));
    assert.ok(csv.includes("'@SUM(A1:A2)"));
    assert.ok(csv.includes("'-5+2"));
    assert.ok(csv.includes('Safe text'));
  });

  it('generates structured export for SLA reports', async () => {
    const exportResult = await reportsService.generateExport('org-001', {
      format: 'json',
      type: 'sla',
    });
    assert.equal(exportResult.format, 'json');
    assert.ok(exportResult.content.data);
  });

  it('rejects invalid export formats or invalid report types', async () => {
    await assert.rejects(
      reportsService.generateExport('org-001', { format: 'docx', type: 'incidents' }),
      /Format must be one of/
    );

    await assert.rejects(
      reportsService.generateExport('org-001', { format: 'csv', type: 'unknown_type' }),
      /Type must be one of/
    );
  });
});
