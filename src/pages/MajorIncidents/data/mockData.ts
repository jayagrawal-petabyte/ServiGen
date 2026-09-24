// Mock data for the MajorIncidents module (SCR-021).
// Replace with real API calls when backend is ready.

import type { MajorIncident, ActivityFeedEntry } from '../types/majorIncident.types';

export const MOCK_MAJOR_INCIDENTS: MajorIncident[] = [
  {
    id: '00022673',
    title: 'System Login Failure',
    priority: 'Critical',
    product: 'myFinance PROD',
    resolutionTarget: '0d 5h 5m',
    responseTarget: 'N/A',
    lifecycleStages: [
      { label: 'Started', timestamp: '11-02-2025 4:57 PM', isActive: true, isCompleted: true },
      { label: 'Escalated', isActive: false, isCompleted: false },
      { label: 'Diagnosed', isActive: false, isCompleted: false },
      { label: 'Mitigated', isActive: false, isCompleted: false },
    ],
  },
  {
    id: '00022672',
    title: 'Financial Data Corruption',
    priority: 'High',
    product: 'myFinance PROD',
    resolutionTarget: '0d 15h 5m',
    responseTarget: 'N/A',
    lifecycleStages: [
      { label: 'Started', timestamp: '11-02-2025 4:58 PM', isActive: true, isCompleted: true },
      { label: 'Escalated', isActive: false, isCompleted: false },
      { label: 'Diagnosed', isActive: false, isCompleted: false },
      { label: 'Mitigated', isActive: false, isCompleted: false },
    ],
  },
  {
    id: '00022671',
    title: 'Payment Processing Failure',
    priority: 'Critical',
    product: 'myFinance PROD',
    resolutionTarget: '-2d 18h 54m',
    responseTarget: 'N/A',
    lifecycleStages: [
      { label: 'Started', timestamp: '11-02-2025 4:52 PM', isActive: true, isCompleted: true },
      { label: 'Escalated', isActive: false, isCompleted: false },
      { label: 'Diagnosed', isActive: false, isCompleted: false },
      { label: 'Mitigated', isActive: false, isCompleted: false },
    ],
  },
];

export const MOCK_FEED_ENTRIES: ActivityFeedEntry[] = [
  {
    id: 'feed-1',
    avatarLabel: 'DU',
    actorName: 'Demo User',
    actorOrg: 'consultation/EMEA',
    ticketRef: '#3995',
    actionLabel: 'New Ticket Logged',
    message: 'mail not Sending',
    timeAgo: '8 days ago',
    type: 'new_ticket',
  },
  {
    id: 'feed-2',
    avatarLabel: 'JW',
    actorName: 'Jennifer Williams',
    actorOrg: 'Halo/EMEA',
    ticketRef: '#3994',
    actionLabel: 'User Update',
    message: 'Every time it slows down, it says something about disk errors?',
    timeAgo: '16 days ago',
    type: 'user_update',
  },
  {
    id: 'feed-3',
    avatarLabel: '4',
    actorName: '',
    ticketRef: '#3994',
    actionLabel: 'Email User',
    message: 'Hi Asha, Would you be able to provide some further information on your issue? Are you seeing any errors whilst it is slowing down?',
    timeAgo: '16 days ago',
    type: 'email_sent',
  },
  {
    id: 'feed-4',
    avatarLabel: 'W',
    actorName: '',
    ticketRef: '#3994',
    actionLabel: 'Triaged',
    message: 'Admin has triaged this ticket and assigned it to 1st Line Support. Impact: Single User Affected\nUrgency: Medium\nCategory: Hardware>Laptop>Physical Damage',
    timeAgo: '16 days ago',
    type: 'triaged',
  },
  {
    id: 'feed-5',
    avatarLabel: 'JW',
    actorName: 'Jennifer Williams',
    actorOrg: 'Halo/EMEA',
    ticketRef: '#3994',
    actionLabel: 'New Ticket Logged',
    message: 'Laptop Issues',
    timeAgo: '16 days ago',
    type: 'new_ticket',
  },
  {
    id: 'feed-6',
    avatarLabel: 'JW',
    actorName: '',
    ticketRef: '#3357',
    actionLabel: 'All Attachment(s) Downloaded',
    timeAgo: '35 days ago',
    type: 'attachment_downloaded',
  },
];
