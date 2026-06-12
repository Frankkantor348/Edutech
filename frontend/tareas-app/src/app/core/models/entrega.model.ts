/** Modelo de entrega de tarea */
export interface Entrega {
  id: number;
  tareaId: number;
  estudianteId: string;
  nombreEstudiante: string;
  fechaEntrega: Date;
  comentarioEstudiante?: string;
  rutaArchivo?: string;
  nombreArchivoOriginal?: string;
  calificacion?: number;
  retroalimentacionDocente?: string;
  fechaCalificacion?: Date;
}
