export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description?: string;
  created_at: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  permissions: Permission[];
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_login?: string;
  roles: Role[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserCreate {
  email: string;
  username: string;
  full_name?: string;
  password: string;
  role_ids: number[];
}

export interface UserUpdate {
  email?: string;
  username?: string;
  full_name?: string;
  password?: string;
  is_active?: boolean;
  status?: UserStatus;
  role_ids?: number[];
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface RoleCreate {
  name: string;
  description?: string;
  permission_ids: number[];
}

export interface RoleUpdate {
  name?: string;
  description?: string;
  permission_ids?: number[];
}

export interface PermissionCreate {
  name: string;
  resource: string;
  action: string;
  description?: string;
}
