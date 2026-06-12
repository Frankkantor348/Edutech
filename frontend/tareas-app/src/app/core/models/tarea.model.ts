/** Modelo de Tarea académica */
export interface Tarea {
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
  fechaEntrega?: Date;
  totalEntregas?: number;
  entregasCalificadas?: number;
}

/** DTO para crear tarea vía JSON */
export interface CrearTareaRequest {
  titulo: string;
  descripcion: string;
  fechaLimite: string;
  curso?: string;
}
