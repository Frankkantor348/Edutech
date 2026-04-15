import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Asignatura {
  id: number;
  nombre: string;
  descripcion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AsignaturaService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAsignaturas(): Observable<Asignatura[]> {
    // DATOS MOCK - Temporal mientras se arregla el backend
    const mockAsignaturas: Asignatura[] = [
      { id: 1, nombre: 'Matemáticas' },
      { id: 2, nombre: 'Sociales' },
      { id: 3, nombre: 'Lenguaje' }
    ];
    
    console.log('Usando datos mock para asignaturas');
    return of(mockAsignaturas);
    
    // TODO: Volver a la llamada real cuando el endpoint funcione
    // return this.http.get<Asignatura[]>(`${this.apiUrl}/asignaturas`);
  }
}