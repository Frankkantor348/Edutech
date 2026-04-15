import { Routes } from '@angular/router';

// Auth
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';

// Features
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { TareasListaComponent } from './features/tareas/tareas-lista.component';
import { FormTareaComponent } from './features/tareas/form-tarea/form-tarea.component';
import { EntregarTareaComponent } from './features/tareas/entregar-tarea/entregar-tarea.component';
import { PerfilComponent } from './features/perfil/perfil.component';
import { ListaEntregasComponent } from './features/entregas/lista-entregas/lista-entregas.component';  // ← NUEVO

// Guards
import { AuthGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // Rutas públicas
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // Rutas protegidas
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'tareas', component: TareasListaComponent, canActivate: [AuthGuard] },
  
  // CRUD de tareas (docente)
  { path: 'tareas/nueva', component: FormTareaComponent, canActivate: [AuthGuard] },
  { path: 'tareas/editar/:id', component: FormTareaComponent, canActivate: [AuthGuard] },
  
  // Entrega de tareas (estudiante)
  { path: 'tareas/entregar/:id', component: EntregarTareaComponent, canActivate: [AuthGuard] },
  
  // ✅ NUEVO: Ver entregas y calificar (docente)
  { path: 'tareas/:id/entregas', component: ListaEntregasComponent, canActivate: [AuthGuard] },
  
  // Perfil
  { path: 'perfil', component: PerfilComponent, canActivate: [AuthGuard] },
  { path: 'inicio', redirectTo: '/dashboard', pathMatch: 'full' },
  
  // Redirección por defecto
  { path: '**', redirectTo: '/login' }
];