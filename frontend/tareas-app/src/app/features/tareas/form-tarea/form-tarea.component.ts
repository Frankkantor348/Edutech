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

@Component({
  selector: 'app-form-tarea',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './form-tarea.component.html',
  styleUrls: ['./form-tarea.component.css']
})
export class FormTareaComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(ToastrService);
  private logger = inject(LoggerService);
  
  tarea = {
    titulo: '',
    descripcion: '',
    fechaLimite: '',
    curso: ''
  };
  
  archivoSeleccionado: File | null = null;
  loading: boolean = false;
  error: string = '';
  esEdicion: boolean = false;
  tareaId: number | null = null;

  ngOnInit() {
    this.logger.info('Iniciando formulario');
    
    const idParam = this.route.snapshot.paramMap.get('id');
    
    if (idParam && idParam !== 'nueva') {
      this.tareaId = Number(idParam);
      this.esEdicion = true;
      this.logger.info(`Editando tarea ID: ${this.tareaId}`);
      this.cargarTarea();
    } else {
      this.esEdicion = false;
      this.loading = false;
    }
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
      
      const extensionesPermitidas = ['.pdf', '.doc', '.docx', '.jpg', '.png', '.zip'];
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

  cargarTarea() {
    this.loading = true;
    const url = `${environment.apiUrl}/TareasApi/${this.tareaId}`;
    
    this.http.get(url).subscribe({
      next: (response: any) => {
        this.tarea = {
          titulo: response.titulo || '',
          descripcion: response.descripcion || '',
          fechaLimite: response.fechaLimite ? response.fechaLimite.split('T')[0] : '',
          curso: response.curso || ''
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.logger.error('Error al cargar tarea', error);
        this.toastr.error('Error al cargar la tarea', 'Error');
        this.error = 'Error al cargar la tarea';
        this.loading = false;
      }
    });
  }

  guardar() {
    this.logger.info('Iniciando guardado', { esEdicion: this.esEdicion });
    
    if (!this.tarea.titulo || !this.tarea.descripcion || !this.tarea.fechaLimite) {
      this.toastr.warning('Complete todos los campos obligatorios', 'Advertencia');
      this.error = 'Complete todos los campos obligatorios';
      return;
    }

    this.loading = true;
    this.error = '';

    const formData = new FormData();
    formData.append('titulo', this.tarea.titulo);
    formData.append('descripcion', this.tarea.descripcion);
    formData.append('fechaLimite', this.tarea.fechaLimite);
    formData.append('curso', this.tarea.curso || '');
    if (this.archivoSeleccionado) {
      formData.append('archivoApoyo', this.archivoSeleccionado);
    }

    const url = this.esEdicion 
      ? `${environment.apiUrl}/TareasApi/${this.tareaId}/form`
      : `${environment.apiUrl}/TareasApi/form`;
    
    const request = this.esEdicion 
      ? this.http.put(url, formData)
      : this.http.post(url, formData);

    request.subscribe({
      next: () => {
        this.logger.info('Guardado exitoso');
        const mensaje = this.esEdicion ? 'Tarea actualizada exitosamente' : 'Tarea creada exitosamente';
        this.toastr.success(mensaje, 'Éxito');
        this.router.navigate(['/tareas']);
      },
      error: (error) => {
        this.logger.error('Error al guardar', error);
        this.toastr.error(error.error?.mensaje || 'Error al guardar la tarea', 'Error');
        this.error = error.error?.mensaje || 'Error al guardar la tarea';
        this.loading = false;
      }
    });
  }

  cancelar() {
    this.router.navigate(['/tareas']);
  }
}
