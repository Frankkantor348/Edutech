import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { AuthService } from '../../core/services/auth.service';
import { LoggerService } from '../../core/services/logger.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type { PerfilUsuario } from '../../core/models/perfil.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private logger = inject(LoggerService);
  
  perfil: PerfilUsuario = {
    email: '',
    nombre: '',
    telefono: '',
    rol: ''
  };
  
  editMode: boolean = false;
  loading: boolean = true;
  saving: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  ngOnInit() {
    this.cargarPerfil();
  }

  cargarPerfil() {
    this.loading = true;
    this.logger.info('Cargando perfil...');
    
    this.http.get<PerfilUsuario>(`${environment.apiUrl}/auth/current-user`).subscribe({
      next: (response) => {
        this.logger.info('Perfil recibido');
        this.perfil = {
          email: response.email || '',
          nombre: response.nombre || response.email?.split('@')[0] || '',
          telefono: response.telefono || '',
          rol: response.rol || ''
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.logger.error('Error al cargar perfil', error);
        this.errorMessage = 'Error al cargar los datos del perfil';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    this.errorMessage = '';
    this.successMessage = '';
    if (!this.editMode) {
      this.cargarPerfil();
    }
  }

  guardar() {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.put<{ mensaje: string }>(`${environment.apiUrl}/auth/actualizar-perfil`, {
      telefono: this.perfil.telefono,
      nombre: this.perfil.nombre || null
    }).subscribe({
      next: (response) => {
        this.successMessage = response.mensaje || 'Perfil actualizado exitosamente';
        this.editMode = false;
        this.saving = false;
        this.cdr.detectChanges();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.logger.error('Error al guardar perfil', error);
        this.errorMessage = error.error?.mensaje || 'Error al actualizar el perfil';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }
}
