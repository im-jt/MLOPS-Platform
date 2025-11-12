import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { 
  User, 
  LoginRequest, 
  LoginResponse, 
  UserCreate, 
  UserUpdate,
  ChangePasswordRequest,
  Role,
  RoleCreate,
  RoleUpdate,
  Permission,
  PermissionCreate
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8000/api/v1';
  private readonly TOKEN_KEY = 'access_token';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if token exists on initialization
    const token = this.getToken();
    if (token) {
      this.loadCurrentUser().subscribe();
    }
  }

  /**
   * Login with username and password
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.setToken(response.access_token);
          this.isAuthenticatedSubject.next(true);
          this.loadCurrentUser().subscribe();
        })
      );
  }

  /**
   * Logout user
   */
  logout(): void {
    this.removeToken();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Get current user information
   */
  loadCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/auth/me`)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
        })
      );
  }

  /**
   * Update current user
   */
  updateCurrentUser(userUpdate: UserUpdate): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/auth/me`, userUpdate)
      .pipe(
        tap(user => this.currentUserSubject.next(user))
      );
  }

  /**
   * Change password
   */
  changePassword(passwordChange: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/me/change-password`, passwordChange);
  }

  /**
   * Get access token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Set access token
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Remove access token
   */
  private removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Get current user value
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(resource: string, action: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.is_superuser) return true;

    return user.roles.some(role =>
      role.permissions.some(perm =>
        perm.resource === resource && perm.action === action
      )
    );
  }

  /**
   * Check if user has any of the specified roles
   */
  hasRole(roleNames: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.is_superuser) return true;

    return user.roles.some(role => roleNames.includes(role.name));
  }

  /**
   * Check if user is superuser
   */
  isSuperuser(): boolean {
    const user = this.getCurrentUser();
    return user?.is_superuser || false;
  }

  // User Management APIs (Admin only)
  
  /**
   * Create a new user
   */
  createUser(userCreate: UserCreate): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/auth/users`, userCreate);
  }

  /**
   * Get all users
   */
  listUsers(skip: number = 0, limit: number = 100): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/auth/users?skip=${skip}&limit=${limit}`);
  }

  /**
   * Get user by ID
   */
  getUser(userId: number): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/auth/users/${userId}`);
  }

  /**
   * Update user
   */
  updateUser(userId: number, userUpdate: UserUpdate): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/auth/users/${userId}`, userUpdate);
  }

  /**
   * Delete user
   */
  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/auth/users/${userId}`);
  }

  // Role Management APIs

  /**
   * Create a new role
   */
  createRole(roleCreate: RoleCreate): Observable<Role> {
    return this.http.post<Role>(`${this.API_URL}/auth/roles`, roleCreate);
  }

  /**
   * Get all roles
   */
  listRoles(skip: number = 0, limit: number = 100): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.API_URL}/auth/roles?skip=${skip}&limit=${limit}`);
  }

  /**
   * Get role by ID
   */
  getRole(roleId: number): Observable<Role> {
    return this.http.get<Role>(`${this.API_URL}/auth/roles/${roleId}`);
  }

  /**
   * Update role
   */
  updateRole(roleId: number, roleUpdate: RoleUpdate): Observable<Role> {
    return this.http.put<Role>(`${this.API_URL}/auth/roles/${roleId}`, roleUpdate);
  }

  /**
   * Delete role
   */
  deleteRole(roleId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/auth/roles/${roleId}`);
  }

  // Permission Management APIs

  /**
   * Create a new permission
   */
  createPermission(permissionCreate: PermissionCreate): Observable<Permission> {
    return this.http.post<Permission>(`${this.API_URL}/auth/permissions`, permissionCreate);
  }

  /**
   * Get all permissions
   */
  listPermissions(skip: number = 0, limit: number = 100): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.API_URL}/auth/permissions?skip=${skip}&limit=${limit}`);
  }

  /**
   * Delete permission
   */
  deletePermission(permissionId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/auth/permissions/${permissionId}`);
  }
}
