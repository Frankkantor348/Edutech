import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  token: string;
  email: string;
  nombre: string;
  rol: string;
  expiracion: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  telefono?: string;
  rol?: string;
}

export interface RegisterResponse {
  mensaje: string;
  email?: string;
  rol?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  login(email: string, password: string): Observable<LoginResponse> {
    console.log('📤 AuthService - Intentando login');
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          console.log('✅ AuthService - Login exitoso, guardando token');
          console.log('Token:', response.token.substring(0, 50) + '...');
          console.log('Rol:', response.rol);
          localStorage.setItem('token', response.token);
          localStorage.setItem('rol', response.rol);
        })
      );
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/register`, userData);
  }

  logout(): void {
    console.log('🚪 AuthService - Cerrando sesión');
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    console.log('🔑 getToken -', token ? 'Token existe' : 'No hay token');
    return token;
  }

  getRol(): string | null {
    const rol = localStorage.getItem('rol');
    console.log('🎭 getRol -', rol);
    return rol;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    console.log('🔐 isAuthenticated - Token existe?', !!token);
    
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const ahora = Date.now();
      const expiracion = payload.exp * 1000;
      const expirado = expiracion < ahora;
      
      console.log('🔐 isAuthenticated - Expiración:', new Date(expiracion));
      console.log('🔐 isAuthenticated - Ahora:', new Date(ahora));
      console.log('🔐 isAuthenticated - Expirado:', expirado);
      
      if (expirado) {
        console.log('🔐 Token expirado, limpiando localStorage');
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        return false;
      }
      console.log('🔐 Token válido');
      return true;
    } catch (error) {
      console.error('🔐 Error decodificando token:', error);
      return false;
    }
  }

  isDocente(): boolean {
    const esDocente = this.getRol() === 'Docente';
    console.log('👨‍🏫 isDocente:', esDocente);
    return esDocente;
  }

  isEstudiante(): boolean {
    const esEstudiante = this.getRol() === 'Estudiante';
    console.log('👨‍🎓 isEstudiante:', esEstudiante);
    return esEstudiante;
  }
}