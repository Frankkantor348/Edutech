using Microsoft.AspNetCore.Identity;

namespace Tareas.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? NombreCompleto { get; set; }
    }
}