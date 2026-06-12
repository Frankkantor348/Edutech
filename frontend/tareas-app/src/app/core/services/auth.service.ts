import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import type { LoginResponse, RegisterRequest, RegisterResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private logger = inject(LoggerService);
  private apiUrl = environment.apiUrl;

  login(email: string, password: string): Observable<LoginResponse> {
    this.logger.info('Intentando login');
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          this.logger.info('Login exitoso, guardando token');
          localStorage.setItem('token', response.token);
          localStorage.setItem('rol', response.rol);
        })
      );
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/register`, userData);
  }

  logout(): void {
    this.logger.info('Cerrando sesión');
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    this.logger.debug(token ? 'Token existe' : 'No hay token');
    return token;
  }

  getRol(): string | null {
    const rol = localStorage.getItem('rol');
    this.logger.debug(`Rol: ${rol}`);
    return rol;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();

    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const ahora = Date.now();
      const expiracion = payload.exp * 1000;
      const expirado = expiracion < ahora;

      if (expirado) {
        this.logger.warn('Token expirado, limpiando localStorage');
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error('Error decodificando token', err);
      return false;
    }
  }

  isDocente(): boolean {
    return this.getRol() === 'Docente';
  }

  isEstudiante(): boolean {
    return this.getRol() === 'Estudiante';
  }
}
