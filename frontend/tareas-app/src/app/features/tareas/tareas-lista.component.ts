import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';  // ✅ Importar Toastr

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
  private toastr = inject(ToastrService);  // ✅ Inyectar Toastr
  
  tareas: Tarea[] = [];
  tareasFiltradas: Tarea[] = [];
  loading: boolean = true;
  error: string = '';
  esDocente: boolean = false;
  today: Date = new Date();
  apiUrl: string = 'http://localhost:5279';
  filtroActual: string = '';

  ngOnInit() {
    console.log('🔵 Componente iniciado');
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
        this.toastr.error('Error al cargar las tareas', 'Error');  // ✅ Notificación
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
          console.log('📋 Mostrando tareas pendientes:', this.tareasFiltradas.length);
          break;
        case 'entregada':
          this.tareasFiltradas = this.tareas.filter(t => t.entregada && !t.calificacion);
          console.log('📋 Mostrando tareas entregadas:', this.tareasFiltradas.length);
          break;
        case 'calificada':
          this.tareasFiltradas = this.tareas.filter(t => t.calificacion !== undefined && t.calificacion !== null);
          console.log('📋 Mostrando tareas calificadas:', this.tareasFiltradas.length);
          break;
        case 'vencida':
          this.tareasFiltradas = this.tareas.filter(t => !t.entregada && this.isVencida(t.fechaLimite));
          console.log('📋 Mostrando tareas vencidas:', this.tareasFiltradas.length);
          break;
        default:
          this.tareasFiltradas = this.tareas;
      }
    } else {
      switch(this.filtroActual) {
        case 'publicadas':
          this.tareasFiltradas = this.tareas;
          console.log('📋 Mostrando todas las tareas publicadas:', this.tareasFiltradas.length);
          break;
        case 'pendientes':
          this.tareasFiltradas = this.tareas.filter(t => t.totalEntregas && t.totalEntregas > 0 && (!t.entregasCalificadas || t.entregasCalificadas === 0));
          console.log('📋 Mostrando tareas con entregas pendientes:', this.tareasFiltradas.length);
          break;
        case 'calificadas':
          this.tareasFiltradas = this.tareas.filter(t => t.entregasCalificadas && t.entregasCalificadas > 0);
          console.log('📋 Mostrando tareas con entregas calificadas:', this.tareasFiltradas.length);
          break;
        default:
          this.tareasFiltradas = this.tareas;
      }
    }
  }

  abrirMaterial(ruta: string | undefined, nombre: string | undefined) {
    console.log('========== DEBUG MATERIAL ==========');
    console.log('Ruta en BD:', ruta);
    console.log('Nombre archivo:', nombre);
    
    if (!ruta) {
      console.error('❌ No hay ruta de archivo');
      this.toastr.warning('No hay archivo disponible', 'Advertencia');  // ✅ Notificación
      return;
    }
    
    const url = `${this.apiUrl}${ruta}`;
    console.log('URL completa:', url);
    console.log('====================================');
    window.open(url, '_blank');
  }

  isVencida(fechaLimite: Date): boolean {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(fechaLimite);
    limite.setHours(0, 0, 0, 0);
    return limite < hoy;
  }

  // ✅ MÉTODO PARA ELIMINAR TAREA CON NOTIFICACIÓN TOAST
  eliminarTarea(tarea: Tarea) {
    if (confirm(`¿Eliminar la tarea "${tarea.titulo}"? Esta acción no se puede deshacer. Se eliminarán también todas las entregas asociadas.`)) {
      console.log(`Eliminando tarea ID: ${tarea.id}`);
      this.http.delete(`${environment.apiUrl}/TareasApi/${tarea.id}`).subscribe({
        next: () => {
          console.log('✅ Tarea eliminada exitosamente');
          this.toastr.success(`Tarea "${tarea.titulo}" eliminada`, 'Éxito');  // ✅ Notificación éxito
          this.cargarTareas();  // Recargar la lista de tareas
        },
        error: (error) => {
          console.error('❌ Error al eliminar:', error);
          this.toastr.error('Error al eliminar la tarea', 'Error');  // ✅ Notificación error
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