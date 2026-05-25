import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegisterRequest } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  telefono: string = '';
  rol: string = 'Estudiante';
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  // Validaciones de contraseña en tiempo real
  hasMinLength: boolean = false;
  hasLowercase: boolean = false;
  hasDigit: boolean = false;

  onSubmit() {
    // Validaciones
    if (!this.email || !this.password) {
      this.errorMessage = 'Complete todos los campos';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    // Validar requisitos de contraseña
    if (!this.hasMinLength || !this.hasLowercase || !this.hasDigit) {
      this.errorMessage = 'La contraseña debe cumplir todos los requisitos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const userData: RegisterRequest = {
      email: this.email,
      password: this.password,
      telefono: this.telefono,
      rol: this.rol
    };

    this.authService.register(userData).subscribe({
      next: (response) => {
        console.log('Registro exitoso:', response);
        this.successMessage = response.mensaje || 'Registro exitoso. Ya puedes iniciar sesión.';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error en registro:', error);
        // Mostrar el mensaje de error del backend si está disponible
        const mensajeError = error.error?.mensaje 
          ? error.error.mensaje 
          : 'Error al registrar usuario';
        this.errorMessage = mensajeError;
        this.loading = false;
      }
    });
  }

  validarPassword() {
    this.hasMinLength = this.password.length >= 6;
    this.hasLowercase = /[a-z]/.test(this.password);
    this.hasDigit = /[0-9]/.test(this.password);
  }

  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}