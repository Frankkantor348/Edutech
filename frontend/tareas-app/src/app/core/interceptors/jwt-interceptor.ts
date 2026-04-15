import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  console.log('🔄 Interceptor - URL:', req.url);
  console.log('🔄 Interceptor - Token existe:', !!token);
  
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('🔄 Interceptor - Token añadido a la petición');
    return next(cloned);
  }
  
  console.log('🔄 Interceptor - Sin token, petición original');
  return next(req);
};