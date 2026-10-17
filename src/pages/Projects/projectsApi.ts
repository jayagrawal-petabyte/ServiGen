const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function getAllProjects() {
  const res = await fetch(`${BASE_URL}/projects`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function getActiveProjects() {
  const res = await fetch(`${BASE_URL}/projects/active`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch active projects');
  return res.json();
}

export async function getProjectSubtasks(projectId: string) {
  const res = await fetch(`${BASE_URL}/projects/${projectId}/subtasks`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch subtasks');
  return res.json();
}