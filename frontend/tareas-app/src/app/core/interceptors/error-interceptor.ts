import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { LoggerService } from '../services/logger.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  const router = inject(Router);
  const logger = inject(LoggerService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      logger.error(`HTTP ${error.status} en ${req.method} ${req.url}`, error.message);

      switch (error.status) {
        case 401:
          toastr.error('Sesión expirada o credenciales inválidas', 'No autorizado');
          localStorage.removeItem('token');
          localStorage.removeItem('rol');
          router.navigate(['/login']);
          break;

        case 403:
          toastr.error('No tienes permisos para realizar esta acción', 'Acceso denegado');
          break;

        case 500:
          toastr.error('Error interno del servidor. Intenta de nuevo más tarde.', 'Error del servidor');
          break;

        case 0:
          // Network error / CORS
          toastr.error('No se puede conectar con el servidor. Verifica tu conexión.', 'Error de conexión');
          break;

        default:
          // Otros errores (400, 404, etc.) los manejará cada componente
          break;
      }

      return throwError(() => error);
    })
  );
};
