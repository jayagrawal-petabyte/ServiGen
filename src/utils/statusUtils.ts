import type { ChangeStatus, CiStatus, ServiceHealthStatus } from '../types/cmdb';

export const getChangeStatusVariant = (status: ChangeStatus | string): 'blue' | 'orange' | 'yellow' | 'purple' | 'green' | 'gray' => {
  switch (status) {
    case 'In Progress':
      return 'blue';
    case 'On Hold':
      return 'orange';
    case 'Pending Approval':
      return 'yellow';
    case 'Scheduled':
      return 'purple';
    case 'Completed':
      return 'green';
    default:
      return 'gray';
  }
};

export const getCiStatusVariant = (status: CiStatus | string): 'green' | 'yellow' | 'red' | 'gray' => {
  switch (status) {
    case 'Active':
    case 'operational':
      return 'green';
    case 'Maintenance':
    case 'degraded':
      return 'yellow';
    case 'Deprecated':
    case 'outage':
      return 'red';
    default:
      return 'gray';
  }
};

export const getPercentBadgeVariant = (percent: number): string => {
  if (percent >= 100) return 'green';
  if (percent >= 50) return 'blue';
  if (percent > 0) return 'yellow';
  return 'gray';
};

export const getServiceHealthVariant = (status: ServiceHealthStatus | string): 'green' | 'yellow' | 'red' => {
  switch (status) {
    case 'Operational':
    case 'operational':
      return 'green';
    case 'Degraded':
    case 'degraded':
      return 'yellow';
    case 'Maintenance':
    case 'maintenance':
    case 'Outage':
    case 'outage':
      return 'red';
    default:
      return 'green';
  }
};
