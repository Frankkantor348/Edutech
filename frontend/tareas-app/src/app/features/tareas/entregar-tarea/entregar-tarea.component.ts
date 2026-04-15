import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';  // ✅ Importar Toastr

// Definir la interfaz para la tarea
interface TareaResponse {
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
  private toastr = inject(ToastrService);  // ✅ Inyectar Toastr
  
  tareaId: number = 0;
  tarea: TareaResponse = {} as TareaResponse;
  comentario: string = '';
  archivoSeleccionado: File | null = null;
  loading: boolean = false;
  error: string = '';
  success: string = '';

  ngOnInit() {
    this.tareaId = Number(this.route.snapshot.paramMap.get('id'));
    console.log('========== ENTREGAR TAREA ==========');
    console.log('1. ID de tarea recibido:', this.tareaId);
    this.cargarTarea();
  }

  cargarTarea() {
    const url = `${environment.apiUrl}/TareasApi/${this.tareaId}`;
    console.log('2. Solicitando URL:', url);
    
    this.http.get<TareaResponse>(url).subscribe({
      next: (response) => {
        console.log('4. ✅ Respuesta recibida del backend:');
        console.log('5. Objeto completo:', response);
        console.log('6. 📚 Curso:', response.curso);
        console.log('7. 📅 Fecha límite:', response.fechaLimite);
        console.log('8. 📌 Título:', response.titulo);
        
        this.tarea = response;
        this.cdr.detectChanges();
        console.log('9. Variable tarea actualizada');
      },
      error: (error) => {
        console.error('❌ ERROR al cargar tarea:', error);
        this.toastr.error('Error al cargar la tarea', 'Error');  // ✅ Notificación error
        this.error = 'Error al cargar la tarea';
        this.cdr.detectChanges();
      }
    });
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
      
      const extensionesPermitidas = ['.pdf', '.doc', '.docx', '.jpg', '.png', '.zip', '.txt'];
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!extensionesPermitidas.includes(extension)) {
        this.toastr.warning('Tipo de archivo no permitido', 'Advertencia');  // ✅ Notificación
        this.error = 'Tipo de archivo no permitido';
        this.archivoSeleccionado = null;
        return;
      }
      
      this.archivoSeleccionado = file;
      this.error = '';
      console.log('✅ Archivo válido:', file.name);
    }
  }

  entregar() {
    if (!this.archivoSeleccionado) {
      this.toastr.warning('Debe seleccionar un archivo', 'Advertencia');  // ✅ Notificación
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
        this.toastr.success('Tarea entregada exitosamente', 'Éxito');  // ✅ Notificación éxito
        this.success = '✅ Tarea entregada exitosamente';
        setTimeout(() => {
          this.router.navigate(['/tareas']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error:', error);
        this.toastr.error(error.error?.mensaje || 'Error al entregar la tarea', 'Error');  // ✅ Notificación error
        this.error = error.error?.mensaje || 'Error al entregar la tarea';
        this.loading = false;
      }
    });
  }

  cancelar() {
    this.router.navigate(['/tareas']);
  }
}