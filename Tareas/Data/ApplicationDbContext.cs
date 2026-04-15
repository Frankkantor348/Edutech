using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Tareas.Models;

namespace Tareas.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>  // ← Cambiado a ApplicationUser
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Tarea> Tareas { get; set; }
        public DbSet<Entrega> Entregas { get; set; }
       // public DbSet<Asignatura> Asignaturas { get; set; }
        public DbSet<PerfilUsuario> PerfilesUsuarios { get; set; }
        public DbSet<ApplicationUser> Users { get; set; }  // ← Agregado para acceder a los usuarios

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configurar relaciones
            builder.Entity<Entrega>()
                .HasOne(e => e.Tarea)
                .WithMany(t => t.Entregas)
                .HasForeignKey(e => e.TareaId)
                .OnDelete(DeleteBehavior.Cascade);

            // Índices para mejorar rendimiento
            builder.Entity<Tarea>()
                .HasIndex(t => t.FechaLimite);

            builder.Entity<Tarea>()
                .HasIndex(t => t.DocenteId);

            builder.Entity<Entrega>()
                .HasIndex(e => e.EstudianteId);

            builder.Entity<Entrega>()
                .HasIndex(e => e.TareaId);
        }
    }
}