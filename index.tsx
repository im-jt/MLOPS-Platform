import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideZonelessChangeDetection, HTTP_INTERCEPTORS } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppComponent } from './src/app.component';
import { APP_ROUTES } from './src/app.routes';
import { AuthInterceptor } from './src/interceptors/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(APP_ROUTES, withHashLocation()),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.