export interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  isActive: boolean;
  isSuperuser: boolean;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  fullName?: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  permissions: string[];
}
