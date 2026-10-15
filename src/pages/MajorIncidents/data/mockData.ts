import type { MajorIncident, ActivityFeedEntry, SidebarGroup } from '../types/majorIncident.types';

const STAGES = (activeIndex: number) => [
  { label: 'Started',   timestamp: '', isActive: activeIndex === 0, isCompleted: activeIndex > 0 },
  { label: 'Escalated', isActive: activeIndex === 1, isCompleted: activeIndex > 1 },
  { label: 'Diagnosed', isActive: activeIndex === 2, isCompleted: activeIndex > 2 },
  { label: 'Mitigated', isActive: activeIndex === 3, isCompleted: activeIndex > 3 },
  { label: 'Resolved',  isActive: activeIndex === 4, isCompleted: activeIndex > 4 },
  { label: 'Closed',    isActive: activeIndex === 5, isCompleted: activeIndex > 5 },
];

export const MOCK_MAJOR_INCIDENTS: MajorIncident[] = [];

export const MOCK_FEED_ENTRIES: ActivityFeedEntry[] = [];

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    groupLabel: 'Active',
    items: [
      { id: 'update-required', label: 'Update Required',            count: 0, isSelected: true, iconKey: 'red-square' },
      { id: 'my-team',         label: 'My Team',                    count: 0, iconKey: 'clipboard' },
      { id: 'critical',        label: 'Critical Major Incidents',   count: 0, iconKey: 'alert' },
    ],
  },
  {
    groupLabel: 'Actioned',
    items: [
      { id: 'closed',          label: 'Closed Major Incidents',     count: 0, iconKey: 'check' },
    ],
  },
  {
    groupLabel: 'Views',
    items: [
      { id: 'board',           label: 'Major Incident Board',       count: 0, iconKey: 'chart' },
      { id: 'calendar',        label: 'Major Incident Calendar',    count: 0, iconKey: 'calendar' },
      { id: 'dashboard',       label: 'Major Incident Dashboard',   count: 0, iconKey: 'globe' },
    ],
  },
];
