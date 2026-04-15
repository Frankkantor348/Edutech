using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tareas.Models
{
    public class Tarea
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Titulo { get; set; } = string.Empty;

        [Required]
        public string Descripcion { get; set; } = string.Empty;

        [Required]
        public DateTime FechaPublicacion { get; set; }

        [Required]
        public DateTime FechaLimite { get; set; }

        public string? ColorSemaforo { get; set; }

        [StringLength(100)]
        public string? Curso { get; set; }

        [Required]
        public string DocenteId { get; set; } = string.Empty;

        // Archivo de apoyo (opcional)
        public string? RutaArchivoApoyo { get; set; }
        public string? NombreArchivoApoyo { get; set; }
        public string? TipoArchivoApoyo { get; set; }

        // Nueva relación con Asignatura
        public int? AsignaturaId { get; set; }

        [ForeignKey("AsignaturaId")]
        public virtual Asignatura? Asignatura { get; set; }

        // Relación con entregas
        public virtual ICollection<Entrega> Entregas { get; set; } = new List<Entrega>();
    }
}