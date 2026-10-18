export type ArticleDraftStatus =
  | 'Draft'
  | 'Awaiting Approval'
  | 'Published'
  | 'Rejected';

export type ArticleDraftSlaStatus =
  | 'safe'
  | 'warning'
  | 'overdue';

export interface ArticleDraft {
  id: string;
  slaTimeLeft: string;
  slaStatus: ArticleDraftSlaStatus;
  summaryTitle: string;
  summarySubtitle: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  priorityColor?: string;
  status: ArticleDraftStatus | string;
  type: string;
  date: string;
  author: string;
  team: string;
  agent: string;
  body: string;
}

export const INITIAL_ARTICLE_DRAFTS: ArticleDraft[] = [
  {
    id: '0003995',
    slaTimeLeft: '1d 8h left',
    slaStatus: 'warning',
    summaryTitle: 'Emails not Sending',
    summarySubtitle: 'Outbox queue stuck during Exchange migration',
    category: 'Email & Messaging',
    priority: 'High',
    priorityColor: '#c2593f',
    status: 'Draft',
    type: 'Article Draft',
    date: '01-08-2026',
    author: 'Inesh Agarwal',
    team: 'Tier 2 Messaging Ops',
    agent: 'Inesh Agarwal',
    body: `## Symptoms
Users report that outbound messages remain indefinitely in the Outlook Outbox queue following hybrid Exchange mailbox move requests.

## Workaround
1. Restart Microsoft Exchange Mail Submission Service on CAS servers.
2. Clear corrupt spool queues using PowerShell cmdlet \`Get-Queue | Retry-Queue\`.
3. Validate TLS 1.2 send connector bindings.`,
  },
  {
    id: '0003027',
    slaTimeLeft: '4d 12h left',
    slaStatus: 'safe',
    summaryTitle: 'How to Submit a Leave Request...',
    summarySubtitle: 'Self-service guide for staff vacation calendar',
    category: 'HR Self-Service',
    priority: 'High',
    priorityColor: '#c2593f',
    status: 'Draft',
    type: 'Article Draft',
    date: '17-07-2026',
    author: 'Sarah Jenkins',
    team: 'HR Operations',
    agent: 'Sarah Jenkins',
    body: `## Overview
This guide explains how employees can submit annual leave and personal day requests through the self-service HR portal.

### Step-by-Step Instructions
1. Navigate to HR Portal > Time Off.
2. Select your date range from the interactive calendar.
3. Choose your leave category (Vacation, Sick, Parental).
4. Submit for manager approval.`,
  },
  {
    id: '0003026',
    slaTimeLeft: '18h left',
    slaStatus: 'warning',
    summaryTitle: 'Resolving Leave Request Issues',
    summarySubtitle: 'Manager approval workflow error code 403 fallback',
    category: 'HR Systems',
    priority: 'High',
    priorityColor: '#c2593f',
    status: 'Awaiting Approval',
    type: 'Article Draft',
    date: '17-07-2026',
    author: 'General User',
    team: 'HR Systems Support',
    agent: 'Inesh Agarwal',
    body: `## Problem Description
Managers encountering error code 403 Forbidden when approving pending time-off requests submitted via mobile web view.

## Solution
Clear delegated authority tokens in the permissions matrix and ensure the approval routing rule is set to synchronous fallback.`,
  },
  {
    id: '0003025',
    slaTimeLeft: '2d 20h left',
    slaStatus: 'safe',
    summaryTitle: 'Incorrect Date Format',
    summarySubtitle: 'Timecard date parse failure on UK locale settings',
    category: 'Localization & Time',
    priority: 'High',
    priorityColor: '#c2593f',
    status: 'Draft',
    type: 'Article Draft',
    date: '17-07-2026',
    author: 'Aditya Kumar Singh',
    team: 'Frontend Core',
    agent: 'Aditya Kumar Singh',
    body: `## Issue Summary
UK locale users experiencing dd/MM/yyyy date parsing failure during timesheet submission in payroll integration.

## Resolution
Adopt standard ISO-8601 formatting prior to submitting API payload.`,
  },
  {
    id: '0003024',
    slaTimeLeft: 'Overdue SLA',
    slaStatus: 'overdue',
    summaryTitle: 'Remove Print Job From Queue',
    summarySubtitle: 'Clearing spooler locks on shared floor printers',
    category: 'Hardware & Printing',
    priority: 'High',
    priorityColor: '#c2593f',
    status: 'Rejected',
    type: 'Article Draft',
    date: '17-07-2026',
    author: 'Inesh Agarwal',
    team: 'Floor Ops',
    agent: 'Inesh Agarwal',
    body: `## Description
Instructions for desk technicians on handling stuck spool jobs without power cycling the floor printer.

## Review Feedback
Rejected: Needs updated screenshots reflecting the new PaperCut web client.`,
  },
  {
    id: '0003019',
    slaTimeLeft: '3d 6h left',
    slaStatus: 'safe',
    summaryTitle: 'VPN Troubleshooting for Remote Workers',
    summarySubtitle: 'GlobalProtect client tunnel timeout diagnostics',
    category: 'Network & Remote',
    priority: 'Medium',
    priorityColor: '#e07a5f',
    status: 'Draft',
    type: 'Article Draft',
    date: '15-07-2026',
    author: 'Mark Daniels',
    team: 'Network Engineering',
    agent: 'Mark Daniels',
    body: `## Guide
Troubleshooting step-by-step instructions for remote staff unable to establish gateway handshakes through Palo Alto GlobalProtect.`,
  },
];