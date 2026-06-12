/** Respuesta del endpoint de login */
export interface LoginResponse {
  token: string;
  email: string;
  nombre: string;
  rol: string;
  expiracion: string;
}

/** DTO para registrar nuevo usuario */
export interface RegisterRequest {
  email: string;
  password: string;
  telefono?: string;
  rol?: string;
}

/** Respuesta del endpoint de registro */
export interface RegisterResponse {
  mensaje: string;
  email?: string;
  rol?: string;
}
