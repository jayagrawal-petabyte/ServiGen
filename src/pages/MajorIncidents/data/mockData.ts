import type { MajorIncident, ActivityFeedEntry, SidebarGroup } from '../types/majorIncident.types';

const STAGES = (activeIndex: number) => [
  { label: 'Started',   timestamp: '', isActive: activeIndex === 0, isCompleted: activeIndex > 0 },
  { label: 'Escalated', isActive: activeIndex === 1, isCompleted: activeIndex > 1 },
  { label: 'Diagnosed', isActive: activeIndex === 2, isCompleted: activeIndex > 2 },
  { label: 'Mitigated', isActive: activeIndex === 3, isCompleted: activeIndex > 3 },
  { label: 'Resolved',  isActive: activeIndex === 4, isCompleted: activeIndex > 4 },
  { label: 'Closed',    isActive: activeIndex === 5, isCompleted: activeIndex > 5 },
];

export const MOCK_MAJOR_INCIDENTS: MajorIncident[] = [
  {
    id: '0002673',
    title: 'System Login Failure',
    priority: 'Critical',
    product: 'MyFinance PROD',
    resolutionTarget: '0d 5h 5m',
    responseTarget: 'N/A',
    assignee: 'Demo User',
    lifecycleStages: [
      { ...STAGES(0)[0], timestamp: '11-02-2025 4:57 PM', isActive: true, isCompleted: false },
      ...STAGES(0).slice(1),
    ],
  },
  {
    id: '0002672',
    title: 'Financial Data Corruption',
    priority: 'High',
    product: 'MyFinance PROD',
    resolutionTarget: '0d 5h 5m',
    responseTarget: 'N/A',
    assignee: 'Jennifer Williams',
    lifecycleStages: [
      { ...STAGES(0)[0], timestamp: '11-02-2025 4:58 PM', isActive: true, isCompleted: false },
      ...STAGES(0).slice(1),
    ],
  },
  {
    id: '0002671',
    title: 'Payment Processing Failure',
    priority: 'Critical',
    product: 'MyFinance PROD',
    resolutionTarget: '-7d 18h 54m',
    responseTarget: 'N/A',
    assignee: 'Unassigned',
    lifecycleStages: [
      { ...STAGES(0)[0], timestamp: '11-02-2025 4:52 PM', isActive: true, isCompleted: false },
      ...STAGES(0).slice(1),
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
    message: 'Mail not sending',
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
    message: 'Hi Asha, Would you be able to provide some further information on your issue?',
    timeAgo: '16 days ago',
    type: 'email_sent',
  },
  {
    id: 'feed-4',
    avatarLabel: 'W',
    actorName: '',
    ticketRef: '#3994',
    actionLabel: 'Triaged',
    message: 'Admin has triaged this ticket and assigned it to 1st Line Support.',
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

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    groupLabel: 'Active',
    items: [
      { id: 'update-required', label: 'Update Required',            count: 3, isSelected: true, iconKey: 'red-square' },
      { id: 'my-team',         label: 'My Team',                    count: 3, iconKey: 'clipboard' },
      { id: 'critical',        label: 'Critical Major Incidents',   count: 2, iconKey: 'alert' },
    ],
  },
  {
    groupLabel: 'Actioned',
    items: [
      { id: 'closed',          label: 'Closed Major Incidents', iconKey: 'check' },
    ],
  },
  {
    groupLabel: 'Views',
    items: [
      { id: 'board',      label: 'Major Incident Board',     count: 3, iconKey: 'chart' },
      { id: 'calendar',   label: 'Major Incident Calendar',            iconKey: 'calendar' },
      { id: 'dashboard',  label: 'Major Incident Dashboard', count: 3, iconKey: 'globe' },
    ],
  },
];
