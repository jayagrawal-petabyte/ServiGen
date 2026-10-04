import type { ChangeStatus, CiStatus, ServiceHealthStatus } from '../types/cmdb';

export const getChangeStatusVariant = (status: ChangeStatus): 'blue' | 'orange' | 'yellow' | 'purple' | 'green' | 'gray' => {
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

export const getCiStatusVariant = (status: CiStatus): 'green' | 'yellow' | 'red' | 'gray' => {
  switch (status) {
    case 'Active':
      return 'green';
    case 'Maintenance':
      return 'yellow';
    case 'Deprecated':
      return 'red';
    default:
      return 'gray';
  }
};

export const getServiceHealthVariant = (status: ServiceHealthStatus): 'green' | 'yellow' | 'red' => {
  switch (status) {
    case 'Operational':
      return 'green';
    case 'Degraded':
      return 'yellow';
    case 'Maintenance':
      return 'red';
    default:
      return 'green';
  }
};
