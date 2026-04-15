import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <div class="d-flex flex-column min-vh-100">
      <router-outlet></router-outlet>
      
      <!-- Footer -->
      <footer class="bg-dark text-white mt-auto py-4">
        <div class="container text-center">
          <p class="mb-0">
            © {{ currentYear }} <strong>EduTech</strong> - Transformando la educación con tecnología
          </p>
          <small class="text-muted">
            Plataforma de gestión de tareas educativas
          </small>
        </div>
      </footer>
    </div>
  `,
  styles: []
})
export class AppComponent {
  title = 'tareas-app';
  currentYear: number = new Date().getFullYear();
}