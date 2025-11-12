import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Structural directive to conditionally render content based on user permissions
 * 
 * Usage:
 * <div *hasPermission="'project:create'">Content for users with project:create permission</div>
 * <div *hasPermission="['project:create', 'project:update']">Content for users with any of these permissions</div>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);
  private hasView = false;
  private requiredPermissions: string[] = [];

  constructor() {
    // React to auth state changes
    effect(() => {
      this.updateView();
    });
  }

  @Input() set hasPermission(permission: string | string[]) {
    this.requiredPermissions = Array.isArray(permission) ? permission : [permission];
    this.updateView();
  }

  private updateView(): void {
    const hasPermission = this.authService.hasAnyPermission(this.requiredPermissions);

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
