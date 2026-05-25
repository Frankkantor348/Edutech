import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';  // ✅ Importar Toastr

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
  private toastr = inject(ToastrService);  // ✅ Inyectar Toastr
  
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
    console.log('🟢 ngOnInit - Iniciando formulario');
    
    const idParam = this.route.snapshot.paramMap.get('id');
    console.log('🟢 idParam:', idParam);
    
    if (idParam && idParam !== 'nueva') {
      this.tareaId = Number(idParam);
      this.esEdicion = true;
      console.log('🟢 Editando tarea ID:', this.tareaId);
      this.cargarTarea();
    } else {
      this.esEdicion = false;
      this.loading = false;
      console.log('🟢 Creando nueva tarea');
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    console.log('📎 Archivo seleccionado:', file?.name);
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.toastr.warning('El archivo no puede superar los 10MB', 'Advertencia');  // ✅ Notificación
        this.error = 'El archivo no puede superar los 10MB';
        this.archivoSeleccionado = null;
        return;
      }
      
      const extensionesPermitidas = ['.pdf', '.doc', '.docx', '.jpg', '.png', '.zip'];
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!extensionesPermitidas.includes(extension)) {
        this.toastr.warning('Tipo de archivo no permitido', 'Advertencia');  // ✅ Notificación
        this.error = 'Tipo de archivo no permitido';
        this.archivoSeleccionado = null;
        return;
      }
      
      this.archivoSeleccionado = file;
      this.error = '';
      console.log('📎 Archivo válido:', file.name);
    }
  }

  cargarTarea() {
    this.loading = true;
    const url = `${environment.apiUrl}/TareasApi/${this.tareaId}`;
    console.log('🔵 Cargando tarea desde:', url);
    
    this.http.get(url).subscribe({
      next: (response: any) => {
        console.log('🔵 Tarea cargada:', response);
        this.tarea = {
          titulo: response.titulo || '',
          descripcion: response.descripcion || '',
          fechaLimite: response.fechaLimite ? response.fechaLimite.split('T')[0] : '',
          curso: response.curso || ''
        };
        this.loading = false;
        this.cdr.detectChanges();
        console.log('🔵 Tarea asignada al formulario:', this.tarea);
      },
      error: (error) => {
        console.error('❌ Error al cargar tarea:', error);
        this.toastr.error('Error al cargar la tarea', 'Error');  // ✅ Notificación
        this.error = 'Error al cargar la tarea';
        this.loading = false;
      }
    });
  }

  guardar() {
    console.log('💾 GUARDAR - Iniciando guardado');
    console.log('💾 Datos de tarea:', this.tarea);
    console.log('💾 Archivo seleccionado:', this.archivoSeleccionado?.name);
    
    if (!this.tarea.titulo || !this.tarea.descripcion || !this.tarea.fechaLimite) {
      this.toastr.warning('Complete todos los campos obligatorios', 'Advertencia');  // ✅ Notificación
      this.error = 'Complete todos los campos obligatorios';
      console.log('❌ Campos incompletos');
      return;
    }

    this.loading = true;
    this.error = '';
    console.log('💾 loading = true');

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
    
    console.log('💾 URL:', url);
    console.log('💾 Es edición:', this.esEdicion);
    
    const request = this.esEdicion 
      ? this.http.put(url, formData)
      : this.http.post(url, formData);

    request.subscribe({
      next: (response) => {
        console.log('✅ GUARDADO EXITOSO:', response);
        const mensaje = this.esEdicion ? 'Tarea actualizada exitosamente' : 'Tarea creada exitosamente';
        this.toastr.success(mensaje, 'Éxito');  // ✅ Notificación éxito
        this.router.navigate(['/tareas']);
      },
      error: (error) => {
        console.error('❌ ERROR AL GUARDAR:');
        console.error('Status:', error.status);
        console.error('Mensaje:', error.error?.mensaje || error.message);
        this.toastr.error(error.error?.mensaje || 'Error al guardar la tarea', 'Error');  // ✅ Notificación error
        this.error = error.error?.mensaje || 'Error al guardar la tarea';
        this.loading = false;
      }
    });
  }

  cancelar() {
    console.log('🔙 Cancelando');
    this.router.navigate(['/tareas']);
  }
}