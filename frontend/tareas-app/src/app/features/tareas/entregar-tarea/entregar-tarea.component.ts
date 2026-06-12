import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastrService } from 'ngx-toastr';
import type { Tarea } from '../../../core/models/tarea.model';

@Component({
  selector: 'app-entregar-tarea',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './entregar-tarea.component.html',
  styleUrls: ['./entregar-tarea.component.css']
})
export class EntregarTareaComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(ToastrService);
  private logger = inject(LoggerService);
  
  tareaId: number = 0;
  tarea: Tarea = {} as Tarea;
  comentario: string = '';
  archivoSeleccionado: File | null = null;
  loading: boolean = false;
  error: string = '';
  success: string = '';

  ngOnInit() {
    this.tareaId = Number(this.route.snapshot.paramMap.get('id'));
    this.logger.info(`Entregar tarea ID: ${this.tareaId}`);
    this.cargarTarea();
  }

  cargarTarea() {
    const url = `${environment.apiUrl}/TareasApi/${this.tareaId}`;
    
    this.http.get<Tarea>(url).subscribe({
      next: (response) => {
        this.logger.info('Tarea cargada para entrega');
        this.tarea = response;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.logger.error('Error al cargar tarea', error);
        this.toastr.error('Error al cargar la tarea', 'Error');
        this.error = 'Error al cargar la tarea';
        this.cdr.detectChanges();
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.logger.debug(`Archivo seleccionado: ${file?.name}`);
    
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.toastr.warning('El archivo no puede superar los 10MB', 'Advertencia');
        this.error = 'El archivo no puede superar los 10MB';
        this.archivoSeleccionado = null;
        return;
      }
      
      const extensionesPermitidas = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.png', '.zip', '.txt'];
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!extensionesPermitidas.includes(extension)) {
        this.toastr.warning('Tipo de archivo no permitido', 'Advertencia');
        this.error = 'Tipo de archivo no permitido';
        this.archivoSeleccionado = null;
        return;
      }
      
      this.archivoSeleccionado = file;
      this.error = '';
    }
  }

  entregar() {
    if (!this.archivoSeleccionado) {
      this.toastr.warning('Debe seleccionar un archivo', 'Advertencia');
      this.error = 'Debe seleccionar un archivo';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const formData = new FormData();
    formData.append('tareaId', this.tareaId.toString());
    formData.append('comentarioEstudiante', this.comentario);
    formData.append('archivoEntrega', this.archivoSeleccionado);

    this.http.post(`${environment.apiUrl}/EntregasApi`, formData).subscribe({
      next: () => {
        this.logger.info('Tarea entregada exitosamente');
        this.toastr.success('Tarea entregada exitosamente', 'Éxito');
        this.success = 'Tarea entregada exitosamente';
        setTimeout(() => {
          this.router.navigate(['/tareas']);
        }, 2000);
      },
      error: (error) => {
        this.logger.error('Error al entregar', error);
        this.toastr.error(error.error?.mensaje || 'Error al entregar la tarea', 'Error');
        this.error = error.error?.mensaje || 'Error al entregar la tarea';
        this.loading = false;
      }
    });
  }

  cancelar() {
    this.router.navigate(['/tareas']);
  }
}
