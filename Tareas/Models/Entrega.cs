using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tareas.Models
{
    public class Entrega
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TareaId { get; set; }

        [Required]
        public string EstudianteId { get; set; } = string.Empty;

        [Required]
        public DateTime FechaEntrega { get; set; }

        public string? ComentarioEstudiante { get; set; }

        // Archivo entregado
        public string? RutaArchivo { get; set; }
        public string? NombreArchivoOriginal { get; set; }

        // Calificación
        public double? Calificacion { get; set; }
        public string? RetroalimentacionDocente { get; set; }
        public DateTime? FechaCalificacion { get; set; }

        // Relación con tarea
        [ForeignKey("TareaId")]
        public virtual Tarea? Tarea { get; set; }
    }
}