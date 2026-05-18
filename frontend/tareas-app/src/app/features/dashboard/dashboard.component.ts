import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { AsignaturaService, Asignatura } from '../../core/services/asignatura.service';

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
  private asignaturaService = inject(AsignaturaService);
  
  // Variables para Docente
  totalTareasPublicadas: number = 0;
  totalEntregasPendientes: number = 0;
  totalEntregasCalificadas: number = 0;
  totalEstudiantes: number = 0;
  
  // Variables para Estudiante
  tareasPendientes: number = 0;
  tareasEntregadas: number = 0;
  tareasCalificadas: number = 0;
  tareasVencidas: number = 0;
  
  // Variables adicionales
  totalTareas: number = 0;  // Para el conteo de tareas filtradas
  totalEstudiantesGlobal: number = 0;  // Estudiantes totales (no se filtran)
  
  loading: boolean = true;
  error: string = '';
  esDocente: boolean = false;

  // Variables para filtros
  asignaturas: Asignatura[] = [];
  cursosDisponibles: string[] = [];
  filtroAsignatura: number | null = null;
  filtroCurso: string = '';
  filtroEstado: string = '';
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';

  ngOnInit() {
    this.esDocente = this.authService.isDocente();
    this.cargarAsignaturas();
    this.cargarCursos();
    this.cargarDashboard();
  }

  cargarAsignaturas() {
    this.asignaturaService.getAsignaturas().subscribe({
      next: (asignaturas) => {
        this.asignaturas = asignaturas;
      },
      error: (error) => console.error('Error cargando asignaturas:', error)
    });
  }

  cargarCursos() {
    this.http.get<string[]>(`${environment.apiUrl}/dashboard/cursos`).subscribe({
      next: (cursos) => {
        this.cursosDisponibles = cursos;
      },
      error: (error) => console.error('Error cargando cursos:', error)
    });
  }

  cargarDashboard() {
  this.loading = true;
  this.cdr.detectChanges();

  let params = new HttpParams();
  
  // Solo agregar parámetros con valores válidos
  if (this.filtroAsignatura !== null && this.filtroAsignatura !== undefined) {
    params = params.set('asignaturaId', this.filtroAsignatura.toString());
  }
  if (this.filtroCurso && this.filtroCurso.trim() !== '') {
    params = params.set('curso', this.filtroCurso);
  }
  if (this.filtroEstado && this.filtroEstado.trim() !== '') {
    params = params.set('estado', this.filtroEstado);
  }
  if (this.filtroFechaDesde && this.filtroFechaDesde.trim() !== '') {
    params = params.set('fechaDesde', this.filtroFechaDesde);
  }
  if (this.filtroFechaHasta && this.filtroFechaHasta.trim() !== '') {
    params = params.set('fechaHasta', this.filtroFechaHasta);
  }

  console.log('📡 Parámetros enviados al backend:', params.toString());

  this.http.get(`${environment.apiUrl}/dashboard`, { params }).subscribe({
    next: (response: any) => {
      console.log('Dashboard response (filtrado):', response);
      
      if (this.esDocente) {
        this.totalTareasPublicadas = response.totalTareasPublicadas || 0;
        this.totalEntregasPendientes = response.totalEntregasPendientes || 0;
        this.totalEntregasCalificadas = response.totalEntregasCalificadas || 0;
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
      console.error('❌ Error:', error);
      this.error = 'Error al cargar el dashboard';
      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}
  aplicarFiltros() {
    this.cargarDashboard();
  }

  limpiarFiltros() {
    this.filtroAsignatura = null;
    this.filtroCurso = '';
    this.filtroEstado = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.cargarDashboard();
  }

  // Navegar a tareas con filtro
  irATareas(filtro: string) {
    this.router.navigate(['/tareas'], { queryParams: { filtro } });
  }
}