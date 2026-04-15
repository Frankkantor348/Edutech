import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  
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
  
  loading: boolean = true;
  error: string = '';
  esDocente: boolean = false;

  ngOnInit() {
    this.esDocente = this.authService.isDocente();
    this.cargarDashboard();
  }

  cargarDashboard() {
    this.loading = true;
    this.cdr.detectChanges();
    
    this.http.get(`${environment.apiUrl}/dashboard`).subscribe({
      next: (response: any) => {
        console.log('Dashboard response:', response);
        
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
        console.error('Error:', error);
        this.error = 'Error al cargar el dashboard';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Navegar a tareas con filtro
  irATareas(filtro: string) {
    this.router.navigate(['/tareas'], { queryParams: { filtro } });
  }
}