import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full text-center">
        <h1 class="text-6xl font-bold text-gray-900 mb-4">403</h1>
        <h2 class="text-2xl font-semibold text-gray-700 mb-4">Access Denied</h2>
        <p class="text-gray-600 mb-8">
          You don't have permission to access this resource.
        </p>
        <button
          (click)="goHome()"
          class="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Go Home
        </button>
      </div>
    </div>
  `,
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/']);
  }
}
