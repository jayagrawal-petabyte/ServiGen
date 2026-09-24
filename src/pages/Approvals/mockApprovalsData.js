export const INITIAL_APPROVALS = [
  {
    id: '3862',
    ticketNumber: '#3862',
    authorName: 'Dispatch Agent (AI)',
    authorInitials: 'DA',
    authorType: 'ai', // orange circle
    onBehalfOf: 'Demo User',
    title: 'Requesting a bulk mailroom pickup of outgoing packages from the second floor',
    timeAgo: '48 days ago',
    createdAt: '2026-08-07T14:32:00Z',
    description: "We have around fifteen parcels ready to go out that won't fit in the usual mailbox collection. Would appreciate a pickup at some point this week rather than carrying them down ourselves.",
    status: 'pending', // 'pending' | 'approved' | 'rejected'
    priority: 'Normal',
    category: 'Facilities & Logistics',
    urgency: 'Medium',
    ticketDetails: null
  },
  {
    id: '3026',
    ticketNumber: '#3026',
    authorName: 'Demo User',
    authorInitials: null,
    authorType: 'user', // blue user icon
    onBehalfOf: 'General User',
    title: 'Resolving Leave Request Issues',
    timeAgo: '48 days ago',
    createdAt: '2026-08-07T11:15:00Z',
    description: "This was created for the article titled 'Resolving Leave Request Issues'",
    status: 'pending',
    priority: 'High',
    category: 'HR Systems',
    urgency: 'High',
    ticketDetails: {
      ticketId: '0003026',
      ticketType: 'Knowledge Article Approval',
      username: 'general.user',
      fullName: 'General User',
      department: 'HR Systems Support',
      extraInfo: 'Article Draft ID: 0003026 - Awaiting Manager Approval'
    }
  },
  {
    id: '2173',
    ticketNumber: '#2173',
    authorName: 'Demo User',
    authorInitials: null,
    authorType: 'user',
    onBehalfOf: 'Demo User',
    title: 'New Starter Request - Jane Smith',
    timeAgo: '264 days ago',
    createdAt: '2026-01-03T09:00:00Z',
    description: 'Hardware, email setup, and security access provisioning required for new hire onboarding in Human Resources.',
    status: 'pending',
    priority: 'High',
    category: 'IT Onboarding',
    urgency: 'High',
    ticketDetails: {
      ticketId: '0002173',
      ticketType: 'New Starter Request',
      username: 'Admin',
      fullName: 'Jane Smith',
      department: 'Human Resources'
    }
  },
  {
    id: '4102',
    ticketNumber: '#4102',
    authorName: 'Sarah Jenkins',
    authorInitials: 'SJ',
    authorType: 'user',
    onBehalfOf: 'Engineering Team',
    title: 'AWS Production Read-Only Role Escalation',
    timeAgo: '2 days ago',
    createdAt: '2026-09-22T08:20:00Z',
    description: 'Temporary 48-hour access extension needed for database migration telemetry verification on cluster eu-west-1.',
    status: 'pending',
    priority: 'Critical',
    category: 'Cloud Infrastructure',
    urgency: 'Critical',
    ticketDetails: {
      ticketId: '0004102',
      ticketType: 'Privilege Access Request',
      username: 'sjenkins',
      fullName: 'Sarah Jenkins',
      department: 'Cloud Platform Ops'
    }
  }
];
