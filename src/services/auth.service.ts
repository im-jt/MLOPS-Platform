import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { User, LoginRequest, RegisterRequest, TokenResponse, AuthState } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:8000/api/v1';

  // Auth state signals
  private user = signal<User | null>(null);
  private token = signal<string | null>(null);
  private permissions = signal<string[]>([]);

  // Computed signals
  isAuthenticated = computed(() => this.user() !== null && this.token() !== null);
  currentUser = computed(() => this.user());
  userPermissions = computed(() => this.permissions());

  constructor() {
    this.loadAuthFromStorage();
  }

  /**
   * Load authentication state from localStorage
   */
  private loadAuthFromStorage(): void {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    const storedPermissions = localStorage.getItem('auth_permissions');

    if (storedToken && storedUser) {
      this.token.set(storedToken);
      this.user.set(JSON.parse(storedUser));
      if (storedPermissions) {
        this.permissions.set(JSON.parse(storedPermissions));
      }
    }
  }

  /**
   * Save authentication state to localStorage
   */
  private saveAuthToStorage(): void {
    const token = this.token();
    const user = this.user();
    const perms = this.permissions();

    if (token && user) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_permissions', JSON.stringify(perms));
    }
  }

  /**
   * Clear authentication state
   */
  private clearAuth(): void {
    this.user.set(null);
    this.token.set(null);
    this.permissions.set([]);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_permissions');
  }

  /**
   * Get HTTP headers with authorization token
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.token();
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<TokenResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    return this.http.post<TokenResponse>(`${this.apiUrl}/auth/login`, formData).pipe(
      tap((response) => {
        this.token.set(response.accessToken);
        this.user.set(response.user);
        // Extract permissions from roles
        const allPermissions = new Set<string>();
        response.user.roles.forEach(role => {
          role.permissions.forEach(perm => allPermissions.add(perm.name));
        });
        if (response.user.isSuperuser) {
          allPermissions.add('*');
        }
        this.permissions.set(Array.from(allPermissions));
        this.saveAuthToStorage();
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Register new user
   */
  register(data: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/register`, data).pipe(
      catchError((error) => {
        console.error('Registration error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current user info
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`, {
      headers: this.getAuthHeaders(),
    }).pipe(
      tap((user) => {
        this.user.set(user);
        // Extract permissions from roles
        const allPermissions = new Set<string>();
        user.roles.forEach(role => {
          role.permissions.forEach(perm => allPermissions.add(perm.name));
        });
        if (user.isSuperuser) {
          allPermissions.add('*');
        }
        this.permissions.set(Array.from(allPermissions));
        this.saveAuthToStorage();
      }),
      catchError((error) => {
        console.error('Get current user error:', error);
        if (error.status === 401) {
          this.logout();
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Get user permissions
   */
  getUserPermissions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/auth/me/permissions`, {
      headers: this.getAuthHeaders(),
    }).pipe(
      tap((perms) => {
        this.permissions.set(perms);
        this.saveAuthToStorage();
      }),
      catchError((error) => {
        console.error('Get permissions error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    const perms = this.permissions();
    return perms.includes('*') || perms.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    const userPerms = this.permissions();
    if (userPerms.includes('*')) {
      return true;
    }
    return permissions.some(perm => userPerms.includes(perm));
  }

  /**
   * Check if user has a specific role
   */
  hasRole(roleName: string): boolean {
    const user = this.user();
    if (!user) return false;
    if (user.isSuperuser) return true;
    return user.roles.some(role => role.name === roleName);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roleNames: string[]): boolean {
    const user = this.user();
    if (!user) return false;
    if (user.isSuperuser) return true;
    return roleNames.some(roleName => user.roles.some(role => role.name === roleName));
  }

  /**
   * Logout user
   */
  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  /**
   * Get auth state
   */
  getAuthState(): AuthState {
    return {
      user: this.user(),
      token: this.token(),
      isAuthenticated: this.isAuthenticated(),
      permissions: this.permissions(),
    };
  }
}
