import type { MajorIncident, ActivityFeedEntry, SidebarGroup } from '../types/majorIncident.types';

export const MOCK_MAJOR_INCIDENTS: MajorIncident[] = [
  {
    id: '0002673',
    title: 'System Login Failure',
    priority: 'Critical',
    product: 'MyFinance PROD',
    resolutionTarget: '-7d 11h 7m',
    responseTarget: 'N/A',
    assignee: 'Demo User',
    lifecycleStages: [
      { label: 'Started', timestamp: '11/02/2025 4:57 PM', isActive: true, isCompleted: false },
      { label: 'Escalated', isActive: false, isCompleted: false },
      { label: 'Diagnosed', isActive: false, isCompleted: false },
      { label: 'Mitigated', isActive: false, isCompleted: false },
      { label: 'Resolved', isActive: false, isCompleted: false },
      { label: 'Closed', isActive: false, isCompleted: false },
    ],
  },
  {
    id: '0002672',
    title: 'Financial Data Corruption',
    priority: 'High',
    product: 'MyFinance PROD',
    resolutionTarget: '-7d 11h 7m',
    responseTarget: 'N/A',
    assignee: 'Jennifer Williams',
    lifecycleStages: [
      { label: 'Started', timestamp: '11/02/2025 4:56 PM', isActive: true, isCompleted: false },
      { label: 'Escalated', isActive: false, isCompleted: false },
      { label: 'Diagnosed', isActive: false, isCompleted: false },
      { label: 'Mitigated', isActive: false, isCompleted: false },
      { label: 'Resolved', isActive: false, isCompleted: false },
      { label: 'Closed', isActive: false, isCompleted: false },
    ],
  },
  {
    id: '0002671',
    title: 'Payment Processing Failure',
    priority: 'Critical',
    product: 'MyFinance PROD',
    resolutionTarget: '-15d 11h 7m',
    responseTarget: 'N/A',
    assignee: 'Unassigned',
    lifecycleStages: [
      { label: 'Started', timestamp: '11/02/2025 4:52 PM', isActive: true, isCompleted: false },
      { label: 'Escalated', isActive: false, isCompleted: false },
      { label: 'Diagnosed', isActive: false, isCompleted: false },
      { label: 'Mitigated', isActive: false, isCompleted: false },
      { label: 'Resolved', isActive: false, isCompleted: false },
      { label: 'Closed', isActive: false, isCompleted: false },
    ],
  },
];

export const MOCK_FEED_ENTRIES: ActivityFeedEntry[] = [
  {
    id: 'f1',
    avatarLabel: 'DU',
    actorName: 'Demo User',
    actorOrg: 'consultancy/EMEA',
    ticketRef: '#3995',
    actionLabel: 'New Ticket Logged',
    message: 'Emails not Sending',
    timeAgo: '16 days ago',
    type: 'new_ticket',
  },
  {
    id: 'f2',
    avatarLabel: 'JW',
    actorName: 'Jennifer Williams',
    actorOrg: 'Halo/EMEA',
    ticketRef: '#3994',
    actionLabel: 'User Update',
    message: 'Every time it slows down, it says something about disk errors?',
    timeAgo: '23 days ago',
    type: 'user_update',
  },
  {
    id: 'f3',
    avatarLabel: '🏆',
    actorName: 'Demo User',
    ticketRef: '#3994',
    actionLabel: 'Email User',
    message: 'Hi Aisha,\nThank you for reaching out.\nWould you be able to provide some further information on your issue? Are you seeing any errors whilst it is slowing down?',
    timeAgo: '23 days ago',
    type: 'email_sent',
  },
  {
    id: 'f4',
    avatarLabel: '🏆',
    actorName: 'Admin',
    ticketRef: '#3994',
    actionLabel: 'Triaged',
    message: 'Admin has triaged this ticket and assigned it to 1st Line Support.',
    timeAgo: '23 days ago',
    type: 'triaged',
  },
];

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    groupLabel: 'Active',
    items: [
      { id: 'update-required', label: 'Update Required', count: 3, isSelected: true, iconKey: 'red-square' },
      { id: 'my-team', label: 'My Team', count: 3, iconKey: 'clipboard' },
      { id: 'critical', label: 'Critical Major Incidents', count: 2, iconKey: 'alert' },
    ],
  },
  {
    groupLabel: 'Actioned',
    items: [
      { id: 'closed', label: 'Closed Major Incidents', iconKey: 'check' },
    ],
  },
  {
    groupLabel: 'Views',
    items: [
      { id: 'board', label: 'Major Incident Board', count: 3, iconKey: 'chart' },
      { id: 'calendar', label: 'Major Incident Calendar', iconKey: 'calendar' },
      { id: 'dashboard', label: 'Major Incident Dashboard', count: 3, iconKey: 'globe' },
    ],
  },
];
