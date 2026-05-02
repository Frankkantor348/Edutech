import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

interface Tarea {
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
  fechaEntrega?: Date; 
  totalEntregas?: number;
  entregasCalificadas?: number;
  asignatura?: {
    id: number;
    nombre: string;
  };
}

@Component({
  selector: 'app-tareas-lista',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
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
  
  tareas: Tarea[] = [];
  tareasFiltradas: Tarea[] = [];
  loading: boolean = true;
  error: string = '';
  esDocente: boolean = false;
  today: Date = new Date();
  // ✅ CORREGIDO: Usar la URL del environment para las API
  // ✅ Para archivos estáticos, usar la URL base sin /api
  apiBaseUrl: string = environment.apiUrl.replace('/api', ''); // http://localhost:5278
  filtroActual: string = '';

  ngOnInit() {
    console.log('🔵 Componente iniciado');
    console.log('📡 API URL:', environment.apiUrl);
    console.log('📁 Base URL para archivos:', this.apiBaseUrl);
    this.esDocente = this.authService.getRol() === 'Docente';
    
    this.route.queryParams.subscribe(params => {
      this.filtroActual = params['filtro'] || '';
      console.log('📋 Filtro recibido desde dashboard:', this.filtroActual);
      this.cargarTareas();
    });
  }

  cargarTareas() {
    console.log('🟢 Cargando tareas...');
    this.loading = true;
    this.cdr.detectChanges();
    
    this.http.get<Tarea[]>(`${environment.apiUrl}/TareasApi`).subscribe({
      next: (tareas) => {
        console.log('✅ Tareas recibidas:', tareas);
        tareas.forEach(t => {
          if (t.rutaArchivoApoyo) {
            console.log(`📎 Tarea "${t.titulo}" - Ruta: ${t.rutaArchivoApoyo}`);
          }
        });
        this.tareas = tareas;
        this.aplicarFiltro();
        this.loading = false;
        this.cdr.detectChanges();
        console.log('🔴 loading = false, vista actualizada');
      },
      error: (error) => {
        console.error('❌ Error:', error);
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
      console.log('📋 Sin filtro, mostrando todas las tareas:', this.tareasFiltradas.length);
      return;
    }

    if (!this.esDocente) {
      switch(this.filtroActual) {
        case 'pendiente':
          this.tareasFiltradas = this.tareas.filter(t => !t.entregada && !this.isVencida(t.fechaLimite));
          break;
        case 'entregada':
          this.tareasFiltradas = this.tareas.filter(t => t.entregada && !t.calificacion);
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
        default:
          this.tareasFiltradas = this.tareas;
      }
    }
    console.log(`📋 Filtro "${this.filtroActual}" - Mostrando ${this.tareasFiltradas.length} tareas`);
  }

  // ✅ MÉTODO CORREGIDO para abrir material de apoyo
  abrirMaterial(ruta: string | undefined, nombre: string | undefined) {
    console.log('========== DEBUG MATERIAL ==========');
    console.log('Ruta en BD:', ruta);
    console.log('Nombre archivo:', nombre);
    console.log('Base URL:', this.apiBaseUrl);
    
    if (!ruta) {
      console.error('❌ No hay ruta de archivo');
      this.toastr.warning('No hay archivo disponible', 'Advertencia');
      return;
    }
    
    // ✅ Construir URL correcta: base (sin /api) + ruta
    const url = `${this.apiBaseUrl}${ruta}`;
    console.log('URL completa:', url);
    console.log('====================================');
    
    // Abrir en nueva pestaña
    window.open(url, '_blank');
  }

  isVencida(fechaLimite: Date): boolean {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(fechaLimite);
    limite.setHours(0, 0, 0, 0);
    return limite < hoy;
  }

  eliminarTarea(tarea: Tarea) {
    if (confirm(`¿Eliminar la tarea "${tarea.titulo}"? Esta acción no se puede deshacer. Se eliminarán también todas las entregas asociadas.`)) {
      console.log(`🗑️ Eliminando tarea ID: ${tarea.id}`);
      this.http.delete(`${environment.apiUrl}/TareasApi/${tarea.id}`).subscribe({
        next: () => {
          console.log('✅ Tarea eliminada exitosamente');
          this.toastr.success(`Tarea "${tarea.titulo}" eliminada`, 'Éxito');
          this.cargarTareas();
        },
        error: (error) => {
          console.error('❌ Error al eliminar:', error);
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
    console.log(`📋 Ver entregas de tarea ID: ${id}`);
    this.router.navigate([`/tareas/${id}/entregas`]);
  }
}