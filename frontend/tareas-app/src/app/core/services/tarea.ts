import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  fechaPublicacion: Date;
  fechaLimite: Date;
  colorSemaforo: string;
  curso: string;
  docenteId: string;
  rutaArchivoApoyo?: string;
  nombreArchivoApoyo?: string;
  entregada?: boolean;
  calificacion?: number;
  retroalimentacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TareaService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getTareas(): Observable<Tarea[]> {
    console.log('📚 TareaService - Solicitando tareas');
    return this.http.get<Tarea[]>(`${this.apiUrl}/TareasApi`);
  }

  getTarea(id: number): Observable<Tarea> {
    return this.http.get<Tarea>(`${this.apiUrl}/TareasApi/${id}`);
  }

  crearTarea(tarea: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/TareasApi/json`, tarea);
  }
}