import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Structural directive to conditionally render content based on user roles
 * 
 * Usage:
 * <div *hasRole="'admin'">Content for admin users</div>
 * <div *hasRole="['admin', 'ml_engineer']">Content for admin or ML engineer users</div>
 */
@Directive({
  selector: '[hasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);
  private hasView = false;
  private requiredRoles: string[] = [];

  constructor() {
    // React to auth state changes
    effect(() => {
      this.updateView();
    });
  }

  @Input() set hasRole(role: string | string[]) {
    this.requiredRoles = Array.isArray(role) ? role : [role];
    this.updateView();
  }

  private updateView(): void {
    const hasRole = this.authService.hasAnyRole(this.requiredRoles);

    if (hasRole && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasRole && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
