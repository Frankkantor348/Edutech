using System.ComponentModel.DataAnnotations;

namespace Tareas.Models
{
    public class PerfilUsuario
    {
        [Key]
        public string UserId { get; set; } = string.Empty;

        [StringLength(100)]
        public string? NombreCompleto { get; set; }

        [StringLength(20)]
        public string? Telefono { get; set; }

        public DateTime? FechaNacimiento { get; set; }

        public string? Direccion { get; set; }
    }
}