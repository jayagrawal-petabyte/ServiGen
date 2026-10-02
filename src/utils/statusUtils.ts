export function getCiStatusVariant(status: string): string {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'operational':
      return 'green';
    case 'maintenance':
    case 'degraded':
      return 'yellow';
    case 'deprecated':
    case 'outage':
      return 'red';
    default:
      return 'gray';
  }
}

export function getChangeStatusVariant(status: string): string {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'green';
    case 'in progress':
      return 'blue';
    case 'scheduled':
      return 'purple';
    case 'pending approval':
      return 'yellow';
    default:
      return 'gray';
  }
}

export function getPercentBadgeVariant(percent: number): string {
  if (percent >= 100) return 'green';
  if (percent >= 50) return 'blue';
  if (percent > 0) return 'yellow';
  return 'gray';
}

export function getServiceHealthVariant(health: string): string {
  switch (health?.toLowerCase()) {
    case 'operational':
      return 'green';
    case 'degraded':
      return 'yellow';
    case 'maintenance':
      return 'yellow';
    case 'outage':
      return 'red';
    default:
      return 'gray';
  }
}
