import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { LoggerService } from '../../core/services/logger.service';
import type { DashboardDocenteResponse, DashboardEstudianteResponse } from '../../core/models/dashboard.model';

type DashboardData = DashboardDocenteResponse & DashboardEstudianteResponse;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private logger = inject(LoggerService);
  
  totalTareasPublicadas: number = 0;
  totalEntregasPendientes: number = 0;
  totalEntregasCalificadas: number = 0;
  totalEntregasRealizadas: number = 0;
  totalEntregasNoRealizadas: number = 0;
  totalEstudiantes: number = 0;
  cursosDisponibles: string[] = [];
  cursoSeleccionado: string = '';
  estudiantesMostrados: Array<{ id: string; nombreCompleto: string; email: string }> = [];
  estudiantesTitulo: string = '';
  estudiantesLoading: boolean = false;
  
  tareasPendientes: number = 0;
  tareasEntregadas: number = 0;
  tareasCalificadas: number = 0;
  tareasVencidas: number = 0;
  
  totalTareas: number = 0;
  totalEstudiantesGlobal: number = 0;
  
  loading: boolean = true;
  error: string = '';
  esDocente: boolean = false;

  ngOnInit() {
    this.esDocente = this.authService.isDocente();
    if (this.esDocente) {
      this.cargarCursos();
    }
    this.cargarDashboard();
  }

  cargarDashboard() {
    this.loading = true;
    this.cdr.detectChanges();

    const cursoQuery = this.cursoSeleccionado ? `?curso=${encodeURIComponent(this.cursoSeleccionado)}` : '';
    this.http.get<DashboardData>(`${environment.apiUrl}/dashboard${cursoQuery}`).subscribe({
      next: (response) => {
        if (this.esDocente) {
          this.totalTareasPublicadas = response.totalTareasPublicadas || 0;
          this.totalEntregasPendientes = response.totalEntregasPendientes || 0;
          this.totalEntregasCalificadas = response.totalEntregasCalificadas || 0;
          this.totalEntregasRealizadas = response.totalEntregasRealizadas || 0;
          this.totalEntregasNoRealizadas = response.totalEntregasNoRealizadas || 0;
          this.totalEstudiantes = response.totalEstudiantes || 0;
        } else {
          this.tareasPendientes = response.tareasPendientes || 0;
          this.tareasEntregadas = response.tareasEntregadas || 0;
          this.tareasCalificadas = response.tareasCalificadas || 0;
          this.tareasVencidas = response.tareasVencidas || 0;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.logger.error('Error al cargar dashboard', error);
        this.error = 'Error al cargar el dashboard';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarCursos() {
    this.http.get<string[]>(`${environment.apiUrl}/dashboard/cursos`).subscribe({
      next: (cursos) => {
        this.cursosDisponibles = cursos;
      },
      error: (error) => {
        this.logger.error('Error al cargar cursos', error);
      }
    });
  }

  actualizarCurso() {
    this.estudiantesTitulo = '';
    this.estudiantesMostrados = [];
    this.cargarDashboard();
  }

  exportarExcel() {
    const curso = this.cursoSeleccionado || 'Todos';
    const rows: string[] = [];
    rows.push('Curso;Estado;Cantidad');
    rows.push(`${curso};Entregaron;${this.totalEntregasRealizadas}`);
    rows.push(`${curso};No entregaron;${this.totalEntregasNoRealizadas}`);
    rows.push('');
    rows.push('Nombre;Email;Estado');

    if (this.estudiantesMostrados && this.estudiantesMostrados.length > 0) {
      const estado = this.estudiantesTitulo.includes('no entregaron') ? 'No entregó' : 'Entregó';
      this.estudiantesMostrados.forEach(estudiante => {
        rows.push(`${estudiante.nombreCompleto};${estudiante.email};${estado}`);
      });
    }

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dashboard_docente_${curso.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  irATareas(filtro: string) {
    this.router.navigate(['/tareas'], { queryParams: { filtro } });
  }

  mostrarEstudiantes(tipo: 'entregaron' | 'noEntregaron') {
    this.estudiantesTitulo = tipo === 'entregaron'
      ? 'Estudiantes que entregaron'
      : 'Estudiantes que no entregaron';
    this.estudiantesLoading = true;
    this.estudiantesMostrados = [];
    this.error = '';
    this.cdr.detectChanges();

    const queryTipo = tipo === 'entregaron' ? 'entregaron' : 'noentregaron';
    const cursoQuery = this.cursoSeleccionado ? `&curso=${encodeURIComponent(this.cursoSeleccionado)}` : '';
    const url = `${environment.apiUrl}/dashboard/estudiantes?tipo=${queryTipo}${cursoQuery}`;

    this.http.get<Array<{ id: string; nombreCompleto: string; email: string }>>(url).subscribe({
      next: (estudiantes) => {
        this.estudiantesMostrados = estudiantes;
        this.estudiantesLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.logger.error('Error al cargar estudiantes', error);
        this.error = 'Error al cargar la lista de estudiantes';
        this.estudiantesLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
