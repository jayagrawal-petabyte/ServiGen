export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  networkLogin: string;
  defaultSite: string;
  defaultOrganisation: string;
  region: 'EMEA' | 'APAC' | 'Americas';
  role: 'Administrator' | 'Support Agent' | 'Team Lead' | 'End User' | 'System Manager';
  status: 'Active' | 'Inactive' | 'Pending';
  avatarUrl?: string;
  lastLogin?: string;
  department?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export type AuthTab = 'login' | 'splash' | 'users';
