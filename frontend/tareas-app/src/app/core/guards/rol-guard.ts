import { Injectable, inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RolGuard {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const rolEsperado = route.data['rol'];
    const rolUsuario = this.authService.getRol();

    if (rolUsuario === rolEsperado) {
      return true;
    }

    if (rolUsuario === 'Docente' || rolUsuario === 'Estudiante') {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
    
    return false;
  }
}