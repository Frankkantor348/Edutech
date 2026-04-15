import { Injectable, inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const isAuthenticated = this.authService.isAuthenticated();
    const token = this.authService.getToken();
    const url = state.url;
    
    console.log('🔒 AuthGuard - URL solicitada:', url);
    console.log('🔒 AuthGuard - isAuthenticated:', isAuthenticated);
    console.log('🔒 AuthGuard - Token existe:', !!token);
    
    if (isAuthenticated) {
      console.log('✅ AuthGuard - Acceso permitido a:', url);
      return true;
    }
    
    console.log('❌ AuthGuard - Redirigiendo a login desde:', url);
    // Guardar la URL a la que quería ir para redirigir después del login
    localStorage.setItem('redirectUrl', url);
    this.router.navigate(['/login']);
    return false;
  }
}