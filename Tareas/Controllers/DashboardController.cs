using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Tareas.Data;
using Tareas.Models;

namespace Tareas.Controllers.Api
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public DashboardController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET: api/dashboard
        [HttpGet]
        public async Task<IActionResult> GetDashboard(
            [FromQuery] int? asignaturaId,
            [FromQuery] string? curso,
            [FromQuery] string? estado,
            [FromQuery] DateTime? fechaDesde,
            [FromQuery] DateTime? fechaHasta)
        {
            if (User.IsInRole("Docente"))
            {
                return Ok(await GetDashboardDocente(asignaturaId, curso, estado, fechaDesde, fechaHasta));
            }
            else if (User.IsInRole("Estudiante"))
            {
                return Ok(await GetDashboardEstudiante(asignaturaId, curso, estado, fechaDesde, fechaHasta));
            }

            return Unauthorized(new { mensaje = "Rol no válido" });
        }

        private async Task<DashboardDocenteResponse> GetDashboardDocente(
    int? asignaturaId, string? curso, string? estado, DateTime? fechaDesde, DateTime? fechaHasta)
{
    var docenteId = User.FindFirstValue(ClaimTypes.NameIdentifier);

    // Query base con filtros
    var query = _context.Tareas
        .Where(t => t.DocenteId == docenteId);

    // Aplicar filtros
    if (asignaturaId.HasValue)
        query = query.Where(t => t.AsignaturaId == asignaturaId);
    
    if (!string.IsNullOrEmpty(curso))
        query = query.Where(t => t.Curso == curso);
    
    if (fechaDesde.HasValue)
        query = query.Where(t => t.FechaLimite >= fechaDesde.Value);
    
    if (fechaHasta.HasValue)
        query = query.Where(t => t.FechaLimite <= fechaHasta.Value);

    var tareas = await query
        .OrderByDescending(t => t.FechaPublicacion)
        .ToListAsync();

    var tareasIds = tareas.Select(t => t.Id).ToList();

    var entregasPorTarea = await _context.Entregas
        .Where(e => tareasIds.Contains(e.TareaId))
        .GroupBy(e => e.TareaId)
        .Select(g => new { TareaId = g.Key, Count = g.Count() })
        .ToDictionaryAsync(g => g.TareaId, g => g.Count);

    var totalEstudiantes = await _userManager.GetUsersInRoleAsync("Estudiante");
    var totalEstudiantesCount = totalEstudiantes.Count;

    // Calcular entregas solo de las tareas filtradas
    var entregasQuery = _context.Entregas
        .Where(e => tareasIds.Contains(e.TareaId));

    // Aplicar filtro de estado para entregas
    if (estado != null)
    {
        switch (estado)
        {
            case "pendientes":
                entregasQuery = entregasQuery.Where(e => e.Calificacion == null);
                break;
            case "calificadas":
                entregasQuery = entregasQuery.Where(e => e.Calificacion != null);
                break;
        }
    }

    var totalEntregasPendientes = await entregasQuery.CountAsync(e => e.Calificacion == null);
    var totalEntregasCalificadas = await entregasQuery.CountAsync(e => e.Calificacion != null);

    return new DashboardDocenteResponse
    {
        TotalTareasPublicadas = tareas.Count,
        TotalEntregasPendientes = totalEntregasPendientes,
        TotalEntregasCalificadas = totalEntregasCalificadas,
        TotalEstudiantes = totalEstudiantesCount,
        TareasRecientes = tareas.Take(5).Select(t => new TareaResumenResponse
        {
            Id = t.Id,
            Titulo = t.Titulo,
            FechaLimite = t.FechaLimite,
            EntregasRealizadas = entregasPorTarea.ContainsKey(t.Id) ? entregasPorTarea[t.Id] : 0,
            EntregasPendientes = totalEstudiantesCount - (entregasPorTarea.ContainsKey(t.Id) ? entregasPorTarea[t.Id] : 0)
        }).ToList()
    };
}
        private async Task<DashboardEstudianteResponse> GetDashboardEstudiante(
            int? asignaturaId, string? curso, string? estado, DateTime? fechaDesde, DateTime? fechaHasta)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Query base con filtros
            var query = _context.Tareas.AsQueryable();

            if (asignaturaId.HasValue)
                query = query.Where(t => t.AsignaturaId == asignaturaId);
            
            if (!string.IsNullOrEmpty(curso))
                query = query.Where(t => t.Curso == curso);
            
            if (fechaDesde.HasValue)
                query = query.Where(t => t.FechaLimite >= fechaDesde.Value);
            
            if (fechaHasta.HasValue)
                query = query.Where(t => t.FechaLimite <= fechaHasta.Value);

            var tareas = await query
                .OrderBy(t => t.FechaLimite)
                .ToListAsync();

            var entregasRealizadas = await _context.Entregas
                .Where(e => e.EstudianteId == userId)
                .Select(e => new { e.TareaId, e.Calificacion, e.FechaEntrega, e.RetroalimentacionDocente })
                .ToDictionaryAsync(e => e.TareaId, e => e);

            var hoy = DateTime.Now.Date;

            var tareasViewModel = tareas.Select(t =>
            {
                entregasRealizadas.TryGetValue(t.Id, out var entrega);
                var entregada = entrega != null;
                var calificada = entrega?.Calificacion.HasValue ?? false;

                // Aplicar filtro de estado si viene
                if (estado != null)
                {
                    bool cumpleFiltro = estado switch
                    {
                        "pendiente" => !entregada && t.FechaLimite.Date >= hoy,
                        "entregada" => entregada && !calificada,
                        "calificada" => calificada,
                        "vencida" => !entregada && t.FechaLimite.Date < hoy,
                        _ => true
                    };
                    if (!cumpleFiltro) return null;
                }

                return new TareaEstudianteResponse
                {
                    Id = t.Id,
                    Titulo = t.Titulo,
                    Descripcion = t.Descripcion,
                    FechaPublicacion = t.FechaPublicacion,
                    FechaLimite = t.FechaLimite,
                    ColorSemaforo = t.ColorSemaforo,
                    Entregada = entregada,
                    FechaEntrega = entrega?.FechaEntrega,
                    Calificada = calificada,
                    Calificacion = entrega?.Calificacion,
                    Retroalimentacion = entrega?.RetroalimentacionDocente,
                    RutaArchivoApoyo = t.RutaArchivoApoyo,
                    NombreArchivoApoyo = t.NombreArchivoApoyo,
                    TipoArchivoApoyo = t.TipoArchivoApoyo
                };
            })
            .Where(t => t != null)
            .ToList();

            return new DashboardEstudianteResponse
            {
                TareasPendientes = tareasViewModel.Count(t => !t.Entregada && t.FechaLimite.Date >= hoy),
                TareasEntregadas = tareasViewModel.Count(t => t.Entregada && !t.Calificada),
                TareasCalificadas = tareasViewModel.Count(t => t.Calificada),
                TareasVencidas = tareasViewModel.Count(t => !t.Entregada && t.FechaLimite.Date < hoy),
                TareasProximas = tareasViewModel
                    .Where(t => !t.Entregada && t.FechaLimite.Date >= hoy)
                    .OrderBy(t => t.FechaLimite)
                    .Take(5)
                    .ToList()
            };
        }

        // GET: api/dashboard/cursos
        [HttpGet("cursos")]
        public async Task<IActionResult> GetCursos()
        {
            var docenteId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var cursos = await _context.Tareas
                .Where(t => t.DocenteId == docenteId)
                .Select(t => t.Curso)
                .Where(c => c != null)
                .Distinct()
                .ToListAsync();

            return Ok(cursos);
        }

        // GET: api/dashboard/estadisticas (solo docente)
        [HttpGet("estadisticas")]
        [Authorize(Roles = "Docente")]
        public async Task<IActionResult> GetEstadisticas()
        {
            var model = await GetDashboardStats();
            return Ok(model);
        }

        private async Task<DashboardStatsResponse> GetDashboardStats()
        {
            var estudiantes = await _userManager.GetUsersInRoleAsync("Estudiante");
            var docentes = await _userManager.GetUsersInRoleAsync("Docente");

            var tareas = await _context.Tareas.ToListAsync();

            var tareasPorEstado = tareas
                .GroupBy(t => t.ColorSemaforo)
                .Select(g => new ChartDataResponse
                {
                    Label = g.Key switch
                    {
                        "verde" => "Con tiempo",
                        "amarillo" => "Próximas a vencer",
                        "rojo" => "Vencidas",
                        _ => g.Key
                    },
                    Value = g.Count(),
                    Color = g.Key switch
                    {
                        "verde" => "#28a745",
                        "amarillo" => "#ffc107",
                        "rojo" => "#dc3545",
                        _ => "#6c757d"
                    }
                }).ToList();

            var entregasPorDia = new List<ChartDataResponse>();
            for (int i = 6; i >= 0; i--)
            {
                var fecha = DateTime.Now.Date.AddDays(-i);
                var entregas = await _context.Entregas.CountAsync(e => e.FechaEntrega.Date == fecha);
                entregasPorDia.Add(new ChartDataResponse
                {
                    Label = fecha.ToString("dd/MM"),
                    Value = entregas,
                    Color = "#007bff"
                });
            }

            var cursos = await _context.Tareas
                .Where(t => t.Curso != null && t.Entregas.Any(e => e.Calificacion.HasValue))
                .Select(t => t.Curso)
                .Distinct()
                .ToListAsync();

            var calificacionesPorCurso = new List<ChartDataResponse>();
            foreach (var curso in cursos.Take(5))
            {
                var entregasCalificadas = await _context.Entregas
                    .Include(e => e.Tarea)
                    .Where(e => e.Tarea != null && e.Tarea.Curso == curso && e.Calificacion.HasValue)
                    .Select(e => e.Calificacion!.Value)
                    .ToListAsync();

                if (entregasCalificadas.Any())
                {
                    var promedio = (int)Math.Round(entregasCalificadas.Average());
                    calificacionesPorCurso.Add(new ChartDataResponse
                    {
                        Label = curso ?? "Sin curso",
                        Value = promedio,
                        Color = ObtenerColorAleatorio()
                    });
                }
            }

            return new DashboardStatsResponse
            {
                TotalEstudiantes = estudiantes.Count,
                TotalDocentes = docentes.Count,
                TotalTareas = tareas.Count,
                TotalEntregas = await _context.Entregas.CountAsync(),
                EntregasPendientes = await _context.Entregas.CountAsync(e => e.Calificacion == null),
                EntregasCalificadas = await _context.Entregas.CountAsync(e => e.Calificacion != null),
                TareasPorEstado = tareasPorEstado.Any() ? tareasPorEstado : new List<ChartDataResponse> { new ChartDataResponse { Label = "Sin tareas", Value = 1, Color = "#6c757d" } },
                EntregasPorDia = entregasPorDia,
                CalificacionesPromedioPorCurso = calificacionesPorCurso.Any() ? calificacionesPorCurso : new List<ChartDataResponse> { new ChartDataResponse { Label = "Sin datos", Value = 0, Color = "#6c757d" } }
            };
        }

        private string ObtenerColorAleatorio()
        {
            var random = new Random();
            var colores = new[] { "#007bff", "#28a745", "#ffc107", "#17a2b8", "#6610f2", "#e83e8c", "#fd7e14" };
            return colores[random.Next(colores.Length)];
        }
    }

    // Response Models
    public class DashboardDocenteResponse
    {
        public int TotalTareasPublicadas { get; set; }
        public int TotalEntregasPendientes { get; set; }
        public int TotalEntregasCalificadas { get; set; }
        public int TotalEstudiantes { get; set; }
        public List<TareaResumenResponse> TareasRecientes { get; set; } = new();
    }

    public class TareaResumenResponse
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public DateTime FechaLimite { get; set; }
        public int EntregasRealizadas { get; set; }
        public int EntregasPendientes { get; set; }
    }

    public class DashboardEstudianteResponse
    {
        public int TareasPendientes { get; set; }
        public int TareasEntregadas { get; set; }
        public int TareasCalificadas { get; set; }
        public int TareasVencidas { get; set; }
        public List<TareaEstudianteResponse> TareasProximas { get; set; } = new();
    }

    public class TareaEstudianteResponse
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public DateTime FechaPublicacion { get; set; }
        public DateTime FechaLimite { get; set; }
        public string? ColorSemaforo { get; set; }
        public bool Entregada { get; set; }
        public DateTime? FechaEntrega { get; set; }
        public bool Calificada { get; set; }
        public double? Calificacion { get; set; }
        public string? Retroalimentacion { get; set; }
        public string? RutaArchivoApoyo { get; set; }
        public string? NombreArchivoApoyo { get; set; }
        public string? TipoArchivoApoyo { get; set; }
    }

    public class DashboardStatsResponse
    {
        public int TotalEstudiantes { get; set; }
        public int TotalDocentes { get; set; }
        public int TotalTareas { get; set; }
        public int TotalEntregas { get; set; }
        public int EntregasPendientes { get; set; }
        public int EntregasCalificadas { get; set; }
        public List<ChartDataResponse> TareasPorEstado { get; set; } = new();
        public List<ChartDataResponse> EntregasPorDia { get; set; } = new();
        public List<ChartDataResponse> CalificacionesPromedioPorCurso { get; set; } = new();
    }

    public class ChartDataResponse
    {
        public string Label { get; set; } = string.Empty;
        public int Value { get; set; }
        public string Color { get; set; } = "#007bff";
    }
}