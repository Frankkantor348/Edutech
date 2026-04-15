import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { environment } from '../../../../environments/environment';

interface Entrega {
  id: number;
  tareaId: number;
  estudianteId: string;
  nombreEstudiante: string;
  fechaEntrega: Date;
  comentarioEstudiante?: string;
  rutaArchivo?: string;
  nombreArchivoOriginal?: string;
  calificacion?: number;
  retroalimentacionDocente?: string;
  fechaCalificacion?: Date;
}

@Component({
  selector: 'app-lista-entregas',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, RouterLink],
  templateUrl: './lista-entregas.component.html',
  styleUrls: ['./lista-entregas.component.css']
})
export class ListaEntregasComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  
  tareaId: number = 0;
  tarea: any = {};
  entregas: Entrega[] = [];
  loading = true;
  error = '';
  
  // Modal de calificación
  showModal = false;
  entregaSeleccionada: Entrega | null = null;
  calificacion: number = 0;
  retroalimentacion: string = '';
  saving = false;

  ngOnInit() {
    this.tareaId = Number(this.route.snapshot.paramMap.get('id'));
    console.log('ID de tarea:', this.tareaId);
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading = true;
    this.cdr.detectChanges();
    
    this.http.get(`${environment.apiUrl}/EntregasApi/tarea/${this.tareaId}`).subscribe({
      next: (response: any) => {
        console.log('Respuesta del backend:', response);
        this.tarea = response.tarea;
        this.entregas = response.entregas || [];
        this.loading = false;
        this.cdr.detectChanges();  // ← Forzar actualización de la vista
        console.log('Entregas cargadas:', this.entregas);
        console.log('loading:', this.loading);
      },
      error: (error) => {
        console.error('Error:', error);
        this.error = 'Error al cargar las entregas';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirModal(entrega: Entrega) {
    this.entregaSeleccionada = entrega;
    this.calificacion = entrega.calificacion || 0;
    this.retroalimentacion = entrega.retroalimentacionDocente || '';
    this.showModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal() {
    this.showModal = false;
    this.entregaSeleccionada = null;
    this.cdr.detectChanges();
  }

  guardarCalificacion() {
    if (!this.entregaSeleccionada) return;
    
    this.saving = true;
    this.cdr.detectChanges();
    
    this.http.put(`${environment.apiUrl}/EntregasApi/${this.entregaSeleccionada.id}/calificar`, {
      calificacion: this.calificacion,
      retroalimentacionDocente: this.retroalimentacion
    }).subscribe({
      next: () => {
        this.cargarDatos();
        this.cerrarModal();
        this.saving = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(error);
        this.error = error.error?.mensaje || 'Error al calificar';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  descargarArchivo(entrega: Entrega) {
    if (entrega.rutaArchivo) {
      window.open(`${environment.apiUrl}/EntregasApi/${entrega.id}/descargar`, '_blank');
    }
  }
}