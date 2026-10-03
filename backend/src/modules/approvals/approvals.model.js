// Mock Data Layer for Approvals

const mockApprovals = [
  {
    id: 'a1',
    title: 'Laptop Request for New Hire',
    requester: 'John Doe',
    service: 'Hardware',
    status: 'Pending',
    submittedAt: '2026-09-24T10:00:00Z',
    description: 'Requires a standard dev laptop.'
  },
  {
    id: 'a2',
    title: 'VPN Access',
    requester: 'Jane Smith',
    service: 'Access',
    status: 'Pending',
    submittedAt: '2026-09-25T14:30:00Z',
    description: 'VPN access for remote work.'
  },
  {
    id: 'a3',
    title: 'Adobe CC License',
    requester: 'Emily Johnson',
    service: 'Software',
    status: 'Approved',
    submittedAt: '2026-09-20T09:15:00Z',
    description: 'Creative Cloud for Marketing team.'
  }
];

const getPendingApprovals = async () => {
  return mockApprovals.filter(a => a.status === 'Pending');
};

const getApprovalById = async (id) => {
  return mockApprovals.find(a => a.id === id) || null;
};

const updateStatus = async (id, status) => {
  const index = mockApprovals.findIndex(a => a.id === id);
  if (index !== -1) {
    mockApprovals[index] = {
      ...mockApprovals[index],
      status
    };
    return mockApprovals[index];
  }
  return null;
};

module.exports = {
  getPendingApprovals,
  getApprovalById,
  updateStatus
};
