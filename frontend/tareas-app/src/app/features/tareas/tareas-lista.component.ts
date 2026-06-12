import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { LoggerService } from '../../core/services/logger.service';
import { ToastrService } from 'ngx-toastr';
import type { Tarea } from '../../core/models/tarea.model';

@Component({
  selector: 'app-tareas-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './tareas-lista.component.html',
  styleUrls: ['./tareas-lista.component.css']
})
export class TareasListaComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(ToastrService);
  private logger = inject(LoggerService);
  
  tareas: Tarea[] = [];
  tareasFiltradas: Tarea[] = [];
  loading: boolean = true;
  error: string = '';
  esDocente: boolean = false;
  today: Date = new Date();
  apiBaseUrl: string = environment.apiUrl.replace('/api', '');
  filtroActual: string = '';
  filtroCurso: string = '';
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';
  cursosDisponibles: string[] = [];

  ngOnInit() {
    this.logger.info(`Componente iniciado. API: ${environment.apiUrl}`);
    this.esDocente = this.authService.getRol() === 'Docente';
    this.cargarCursos();

    this.route.queryParams.subscribe(params => {
      this.filtroActual = params['filtro'] || '';
      this.filtroCurso = params['curso'] || '';
      this.filtroFechaDesde = params['fechaDesde'] || '';
      this.filtroFechaHasta = params['fechaHasta'] || '';
      this.cargarTareas();
    });
  }

  actualizarFiltro() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        filtro: this.filtroActual || null,
        curso: this.filtroCurso || null,
        fechaDesde: this.filtroFechaDesde || null,
        fechaHasta: this.filtroFechaHasta || null
      },
      queryParamsHandling: 'merge'
    });
    this.cargarTareas();
  }

  limpiarFiltro() {
    this.filtroActual = '';
    this.filtroCurso = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        filtro: null,
        curso: null,
        fechaDesde: null,
        fechaHasta: null
      },
      queryParamsHandling: 'merge'
    });
    this.cargarTareas();
  }

  cargarTareas() {
    this.logger.info('Cargando tareas...');
    this.loading = true;
    this.cdr.detectChanges();

    let params = new URLSearchParams();
    if (this.filtroCurso) params.set('curso', this.filtroCurso);
    if (this.filtroFechaDesde) params.set('fechaDesde', this.filtroFechaDesde);
    if (this.filtroFechaHasta) params.set('fechaHasta', this.filtroFechaHasta);

    const url = `${environment.apiUrl}/TareasApi${params.toString() ? '?' + params.toString() : ''}`;

    this.http.get<Tarea[]>(url).subscribe({
      next: (tareas) => {
        this.logger.info(`Tareas recibidas: ${tareas.length}`);
        this.tareas = tareas;
        this.aplicarFiltro();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.logger.error('Error al cargar tareas', error);
        this.toastr.error('Error al cargar las tareas', 'Error');
        this.error = 'Error al cargar las tareas';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  aplicarFiltro() {
    if (!this.filtroActual) {
      this.tareasFiltradas = this.tareas;
      this.logger.debug(`Sin filtro, mostrando ${this.tareasFiltradas.length} tareas`);
      return;
    }

    if (!this.esDocente) {
      switch(this.filtroActual) {
        case 'pendiente':
          this.tareasFiltradas = this.tareas.filter(t => !t.entregada && !this.isVencida(t.fechaLimite));
          break;
        case 'entregada':
          this.tareasFiltradas = this.tareas.filter(t => t.entregada);
          break;
        case 'calificada':
          this.tareasFiltradas = this.tareas.filter(t => t.calificacion !== undefined && t.calificacion !== null);
          break;
        case 'vencida':
          this.tareasFiltradas = this.tareas.filter(t => !t.entregada && this.isVencida(t.fechaLimite));
          break;
        default:
          this.tareasFiltradas = this.tareas;
      }
    } else {
      switch(this.filtroActual) {
        case 'publicadas':
          this.tareasFiltradas = this.tareas;
          break;
        case 'pendientes':
          this.tareasFiltradas = this.tareas.filter(t => t.totalEntregas && t.totalEntregas > 0 && (!t.entregasCalificadas || t.entregasCalificadas === 0));
          break;
        case 'calificadas':
          this.tareasFiltradas = this.tareas.filter(t => t.entregasCalificadas && t.entregasCalificadas > 0);
          break;
        case 'estudiantes':
          this.tareasFiltradas = this.tareas;
          break;
        case 'vencida':
          this.tareasFiltradas = this.tareas.filter(t => this.isVencida(t.fechaLimite));
          break;
        default:
          this.tareasFiltradas = this.tareas;
      }
    }
    this.logger.debug(`Filtro "${this.filtroActual}" - ${this.tareasFiltradas.length} tareas`);
  }

  abrirMaterial(ruta: string | undefined, nombre: string | undefined) {
    if (!ruta) {
      this.logger.warn('No hay ruta de archivo');
      this.toastr.warning('No hay archivo disponible', 'Advertencia');
      return;
    }
    
    const url = `${this.apiBaseUrl}${ruta}`;
    this.logger.debug(`Abriendo material: ${url}`);
    window.open(url, '_blank');
  }

  isVencida(fechaLimite: Date): boolean {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(fechaLimite);
    limite.setHours(0, 0, 0, 0);
    return limite < hoy;
  }

  cargarCursos() {
    this.http.get<string[]>(`${environment.apiUrl}/TareasApi/cursos`).subscribe({
      next: (cursos) => {
        this.cursosDisponibles = cursos;
      },
      error: (error) => {
        this.logger.error('Error cargando cursos', error);
      }
    });
  }

  eliminarTarea(tarea: Tarea) {
    if (confirm(`¿Eliminar la tarea "${tarea.titulo}"? Esta acción no se puede deshacer. Se eliminarán también todas las entregas asociadas.`)) {
      this.logger.info(`Eliminando tarea ID: ${tarea.id}`);
      this.http.delete(`${environment.apiUrl}/TareasApi/${tarea.id}`).subscribe({
        next: () => {
          this.logger.info('Tarea eliminada exitosamente');
          this.toastr.success(`Tarea "${tarea.titulo}" eliminada`, 'Éxito');
          this.cargarTareas();
        },
        error: (error) => {
          this.logger.error('Error al eliminar', error);
          this.toastr.error('Error al eliminar la tarea', 'Error');
          this.error = 'Error al eliminar la tarea';
        }
      });
    }
  }

  verDetalle(id: number) {
    this.router.navigate([`/tareas/editar/${id}`]);
  }

  crearTarea() {
    this.router.navigate(['/tareas/nueva']);
  }

  entregarTarea(id: number) {
    this.router.navigate([`/tareas/entregar/${id}`]);
  }

  verEntregas(id: number) {
    this.logger.info(`Ver entregas de tarea ID: ${id}`);
    this.router.navigate([`/tareas/${id}/entregas`]);
  }
}
