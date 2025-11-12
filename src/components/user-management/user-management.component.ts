import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User, Role, UserCreate, UserUpdate } from '../../models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  roles: Role[] = [];
  loading = false;
  error = '';
  success = '';

  // Modal state
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  selectedUser: User | null = null;

  // Form data
  userForm: Partial<UserCreate & UserUpdate> = {
    username: '',
    email: '',
    full_name: '',
    password: '',
    role_ids: []
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers(): void {
    this.loading = true;
    this.authService.listUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load users';
        this.loading = false;
      }
    });
  }

  loadRoles(): void {
    this.authService.listRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (error) => {
        console.error('Failed to load roles', error);
      }
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedUser = null;
    this.userForm = {
      username: '',
      email: '',
      full_name: '',
      password: '',
      role_ids: []
    };
    this.showModal = true;
  }

  openEditModal(user: User): void {
    this.modalMode = 'edit';
    this.selectedUser = user;
    this.userForm = {
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      is_active: user.is_active,
      status: user.status,
      role_ids: user.roles.map(r => r.id)
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.error = '';
  }

  saveUser(): void {
    this.error = '';
    
    if (this.modalMode === 'create') {
      this.authService.createUser(this.userForm as UserCreate).subscribe({
        next: () => {
          this.success = 'User created successfully';
          this.closeModal();
          this.loadUsers();
          setTimeout(() => this.success = '', 3000);
        },
        error: (error) => {
          this.error = error.error?.detail || 'Failed to create user';
        }
      });
    } else if (this.selectedUser) {
      this.authService.updateUser(this.selectedUser.id, this.userForm as UserUpdate).subscribe({
        next: () => {
          this.success = 'User updated successfully';
          this.closeModal();
          this.loadUsers();
          setTimeout(() => this.success = '', 3000);
        },
        error: (error) => {
          this.error = error.error?.detail || 'Failed to update user';
        }
      });
    }
  }

  deleteUser(user: User): void {
    if (!confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      return;
    }

    this.authService.deleteUser(user.id).subscribe({
      next: () => {
        this.success = 'User deleted successfully';
        this.loadUsers();
        setTimeout(() => this.success = '', 3000);
      },
      error: (error) => {
        this.error = error.error?.detail || 'Failed to delete user';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  toggleRole(roleId: number): void {
    const roleIds = this.userForm.role_ids || [];
    const index = roleIds.indexOf(roleId);
    
    if (index > -1) {
      roleIds.splice(index, 1);
    } else {
      roleIds.push(roleId);
    }
    
    this.userForm.role_ids = roleIds;
  }

  isRoleSelected(roleId: number): boolean {
    return (this.userForm.role_ids || []).includes(roleId);
  }

  getRoleBadgeColor(roleName: string): string {
    const colors: { [key: string]: string } = {
      'admin': 'bg-red-100 text-red-800',
      'manager': 'bg-purple-100 text-purple-800',
      'developer': 'bg-blue-100 text-blue-800',
      'viewer': 'bg-gray-100 text-gray-800'
    };
    return colors[roleName] || 'bg-gray-100 text-gray-800';
  }

  getStatusBadgeColor(status: string): string {
    const colors: { [key: string]: string } = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'suspended': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
}
