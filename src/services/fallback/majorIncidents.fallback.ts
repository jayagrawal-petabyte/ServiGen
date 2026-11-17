import type { MajorIncident } from '../../pages/MajorIncidents/types/majorIncident.types';
import { STAGE_LABELS } from '../majorIncidents.lifecycle';


function stages(activeLabel: string): MajorIncident['lifecycleStages'] {
  const activeIndex = Math.max(0, STAGE_LABELS.indexOf(activeLabel as never));
  return STAGE_LABELS.map((label, idx) => ({
    label,
    isActive: idx === activeIndex,
    isCompleted: idx < activeIndex,
    timestamp: undefined,
  }));
}

export const FALLBACK_MAJOR_INCIDENTS: MajorIncident[] = [
  {
    id: 'MI-1001',
    title: 'Customer portal unavailable',
    priority: 'Critical',
    product: 'Customer Portal, Authentication API',
    resolutionTarget: '0d 4h 0m',
    responseTarget: '15m SLA',
    assignee: 'Alex Morgan',
    lifecycleStages: stages('Escalated'),
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updates: [
      {
        id: 'MI-1001-U1',
        timestamp: '08:05',
        author: 'System',
        authorRole: 'Admin',
        type: 'comment',
        content: 'Incident declared and investigation started.',
      },
    ],
  },
  {
    id: 'MI-1002',
    title: 'Email notifications delayed',
    priority: 'High',
    product: 'Notification Service',
    resolutionTarget: '0d 8h 0m',
    responseTarget: '30m SLA',
    assignee: 'Priya Nair',
    lifecycleStages: stages('Diagnosed'),
    startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updates: [
      {
        id: 'MI-1002-U1',
        timestamp: '06:20',
        author: 'Priya Nair',
        authorRole: 'Manager',
        type: 'comment',
        content: 'Root cause identified: SMTP relay throttling.',
      },
    ],
  },
  {
    id: 'MI-1003',
    title: 'Reporting dashboard timeouts',
    priority: 'High',
    product: 'Reporting',
    resolutionTarget: 'Completed',
    responseTarget: '30m SLA',
    assignee: 'Sam Okafor',
    lifecycleStages: stages('Resolved'),
    startedAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    updates: [],
  },
];

export default FALLBACK_MAJOR_INCIDENTS;
