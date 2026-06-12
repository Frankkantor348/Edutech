import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import type { Tarea, CrearTareaRequest } from '../models/tarea.model';

@Injectable({
  providedIn: 'root'
})
export class TareaService {
  private http = inject(HttpClient);
  private logger = inject(LoggerService);
  private apiUrl = environment.apiUrl;

  getTareas(): Observable<Tarea[]> {
    this.logger.info('Solicitando tareas');
    return this.http.get<Tarea[]>(`${this.apiUrl}/TareasApi`);
  }

  getTarea(id: number): Observable<Tarea> {
    return this.http.get<Tarea>(`${this.apiUrl}/TareasApi/${id}`);
  }

  crearTarea(tarea: CrearTareaRequest): Observable<{ mensaje: string; tareaId: number }> {
    return this.http.post<{ mensaje: string; tareaId: number }>(`${this.apiUrl}/TareasApi/json`, tarea);
  }
}
