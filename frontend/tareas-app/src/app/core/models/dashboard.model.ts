/** Respuesta del dashboard para docente */
export interface DashboardDocenteResponse {
  totalTareasPublicadas: number;
  totalEntregasPendientes: number;
  totalEntregasCalificadas: number;
  totalEntregasRealizadas: number;
  totalEntregasNoRealizadas: number;
  totalEstudiantes: number;
}

/** Respuesta del dashboard para estudiante */
export interface DashboardEstudianteResponse {
  tareasPendientes: number;
  tareasEntregadas: number;
  tareasCalificadas: number;
  tareasVencidas: number;
}

export type DashboardResponse = DashboardDocenteResponse | DashboardEstudianteResponse;
