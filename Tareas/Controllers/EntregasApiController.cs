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
    public class EntregasApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly UserManager<ApplicationUser> _userManager;

        public EntregasApiController(
            ApplicationDbContext context,
            IWebHostEnvironment webHostEnvironment,
            UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _webHostEnvironment = webHostEnvironment;
            _userManager = userManager;
        }

        // ==========================================
        // GET: api/entregas/tarea/{tareaId}
        // ==========================================
        // GET: api/entregas/tarea/5
        [HttpGet("tarea/{tareaId}")]
        [Authorize(Roles = "Docente")]
        public async Task<IActionResult> GetEntregasPorTarea(int tareaId)
        {
            try
            {
                Console.WriteLine($"=== GetEntregasPorTarea - tareaId: {tareaId} ===");

                // 1. Obtener la tarea
                var tarea = await _context.Tareas.FirstOrDefaultAsync(t => t.Id == tareaId);
                if (tarea == null)
                {
                    return NotFound(new { mensaje = "Tarea no encontrada" });
                }

                // 2. Verificar autorización
                var docenteId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (tarea.DocenteId != docenteId)
                {
                    return Forbid();
                }

                // 3. Obtener entregas con datos básicos
                var entregas = await _context.Entregas
                    .Where(e => e.TareaId == tareaId)
                    .OrderBy(e => e.FechaEntrega)
                    .Select(e => new
                    {
                        e.Id,
                        e.TareaId,
                        e.EstudianteId,
                        e.FechaEntrega,
                        e.ComentarioEstudiante,
                        e.RutaArchivo,
                        e.NombreArchivoOriginal,
                        e.Calificacion,
                        e.RetroalimentacionDocente,
                        e.FechaCalificacion
                    })
                    .ToListAsync();

                Console.WriteLine($"Entregas encontradas: {entregas.Count}");

                // 4. Obtener nombres de estudiantes
                var estudiantesIds = entregas.Select(e => e.EstudianteId).Distinct().ToList();
                var estudiantes = await _context.Users
                    .Where(u => estudiantesIds.Contains(u.Id))
                    .ToDictionaryAsync(u => u.Id, u => u.Email ?? "Desconocido");

                // 5. Construir respuesta
                var response = entregas.Select(e => new
                {
                    e.Id,
                    e.TareaId,
                    e.EstudianteId,
                    NombreEstudiante = estudiantes.GetValueOrDefault(e.EstudianteId, "Desconocido"),
                    e.FechaEntrega,
                    e.ComentarioEstudiante,
                    e.RutaArchivo,
                    e.NombreArchivoOriginal,
                    e.Calificacion,
                    e.RetroalimentacionDocente,
                    e.FechaCalificacion
                }).ToList();

                return Ok(new { tarea, entregas = response });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR: {ex.Message}");
                Console.WriteLine($"STACK: {ex.StackTrace}");
                return StatusCode(500, new { mensaje = ex.Message, stack = ex.StackTrace });
            }
        }
        // ==========================================
        // GET: api/entregas/mis-entregas
        // ==========================================
        [HttpGet("mis-entregas")]
        [Authorize(Roles = "Estudiante")]
        public async Task<IActionResult> GetMisEntregas()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                var entregas = await _context.Entregas
                    .Include(e => e.Tarea)
                    .Where(e => e.EstudianteId == userId)
                    .OrderByDescending(e => e.FechaEntrega)
                    .Select(e => new MisEntregasResponse
                    {
                        Id = e.Id,
                        TareaId = e.TareaId,
                        TituloTarea = e.Tarea != null ? e.Tarea.Titulo : "Sin título",
                        FechaLimite = e.Tarea != null ? e.Tarea.FechaLimite : DateTime.MinValue,
                        FechaEntrega = e.FechaEntrega,
                        Calificacion = e.Calificacion,
                        Retroalimentacion = e.RetroalimentacionDocente,
                        NombreArchivo = e.NombreArchivoOriginal
                    })
                    .ToListAsync();

                return Ok(entregas);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR en GetMisEntregas: {ex.Message}");
                return StatusCode(500, new { mensaje = ex.Message });
            }
        }

        // ==========================================
        // POST: api/entregas
        // ==========================================
        [HttpPost]
        [Authorize(Roles = "Estudiante")]
        public async Task<IActionResult> CrearEntrega([FromForm] CrearEntregaRequest request)
        {
            try
            {
                var tarea = await _context.Tareas.FindAsync(request.TareaId);
                if (tarea == null)
                    return NotFound(new { mensaje = "Tarea no encontrada" });

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // Verificar si ya entregó
                var yaEntrego = await _context.Entregas
                    .AnyAsync(e => e.TareaId == request.TareaId && e.EstudianteId == userId);

                if (yaEntrego)
                    return BadRequest(new { mensaje = "Ya has entregado esta tarea anteriormente" });

                // Verificar si está vencida
                if (tarea.FechaLimite.Date < DateTime.Now.Date)
                    return BadRequest(new { mensaje = "Esta tarea ya está vencida, no se puede entregar" });

                // Validar archivo
                if (request.ArchivoEntrega == null || request.ArchivoEntrega.Length == 0)
                    return BadRequest(new { mensaje = "Debes adjuntar un archivo" });

                // Validar extensión
                var extension = Path.GetExtension(request.ArchivoEntrega.FileName).ToLower();
                var extensionesPermitidas = new[] { ".pdf", ".doc", ".docx", ".txt", ".zip", ".jpg", ".png" };
                if (!extensionesPermitidas.Contains(extension))
                    return BadRequest(new { mensaje = "Tipo de archivo no permitido" });

                // Validar tamaño (10MB)
                if (request.ArchivoEntrega.Length > 10 * 1024 * 1024)
                    return BadRequest(new { mensaje = "El archivo no puede ser mayor a 10MB" });

                // Guardar archivo
                var nombreArchivo = $"{Guid.NewGuid()}{extension}";
                var carpeta = Path.Combine("uploads", "entregas", request.TareaId.ToString());
                var rutaCarpeta = Path.Combine(_webHostEnvironment.WebRootPath, carpeta);

                if (!Directory.Exists(rutaCarpeta))
                    Directory.CreateDirectory(rutaCarpeta);

                var rutaCompleta = Path.Combine(rutaCarpeta, nombreArchivo);
                using (var stream = new FileStream(rutaCompleta, FileMode.Create))
                {
                    await request.ArchivoEntrega.CopyToAsync(stream);
                }

                var rutaArchivo = Path.Combine("/", carpeta, nombreArchivo).Replace("\\", "/");

                var entrega = new Entrega
                {
                    TareaId = request.TareaId,
                    EstudianteId = userId,
                    FechaEntrega = DateTime.Now,
                    ComentarioEstudiante = request.ComentarioEstudiante,
                    RutaArchivo = rutaArchivo,
                    NombreArchivoOriginal = request.ArchivoEntrega.FileName
                };

                _context.Entregas.Add(entrega);
                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Tarea entregada correctamente", entregaId = entrega.Id });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR en CrearEntrega: {ex.Message}");
                return StatusCode(500, new { mensaje = ex.Message });
            }
        }

        // ==========================================
        // PUT: api/entregas/{id}/calificar
        // ==========================================
        [HttpPut("{id}/calificar")]
        [Authorize(Roles = "Docente")]
        public async Task<IActionResult> CalificarEntrega(int id, [FromBody] CalificarRequest request)
        {
            try
            {
                var entrega = await _context.Entregas
                    .Include(e => e.Tarea)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (entrega == null)
                    return NotFound(new { mensaje = "Entrega no encontrada" });

                var docenteId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (entrega.Tarea?.DocenteId != docenteId)
                    return Forbid();

                entrega.Calificacion = request.Calificacion;
                entrega.RetroalimentacionDocente = request.RetroalimentacionDocente?.Trim();
                entrega.FechaCalificacion = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Calificación guardada correctamente" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR en CalificarEntrega: {ex.Message}");
                return StatusCode(500, new { mensaje = ex.Message });
            }
        }

        // ==========================================
        // GET: api/entregas/{id}/descargar
        // ==========================================
        [HttpGet("{id}/descargar")]
        public async Task<IActionResult> DescargarArchivo(int id)
        {
            try
            {
                var entrega = await _context.Entregas
                    .Include(e => e.Tarea)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (entrega == null || string.IsNullOrEmpty(entrega.RutaArchivo))
                    return NotFound(new { mensaje = "Archivo no encontrado" });

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var esDocente = User.IsInRole("Docente");
                var esPropietario = entrega.EstudianteId == userId;

                if (!esDocente && !esPropietario)
                    return Forbid();

                if (esDocente && entrega.Tarea?.DocenteId != userId)
                    return Forbid();

                var rutaFisica = Path.Combine(_webHostEnvironment.WebRootPath, entrega.RutaArchivo.TrimStart('/'));
                if (!System.IO.File.Exists(rutaFisica))
                    return NotFound(new { mensaje = "Archivo no existe en el servidor" });

                var bytes = await System.IO.File.ReadAllBytesAsync(rutaFisica);
                var nombreDescarga = $"{entrega.Tarea?.Titulo ?? "tarea"}_{entrega.NombreArchivoOriginal ?? "archivo"}";

                return File(bytes, "application/octet-stream", nombreDescarga);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR en DescargarArchivo: {ex.Message}");
                return StatusCode(500, new { mensaje = ex.Message });
            }
        }
        [HttpGet("test")]
        public IActionResult Test()
        {
            try
            {
                return Ok(new { mensaje = "El controlador funciona", timestamp = DateTime.Now });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    // ==========================================
    // REQUEST / RESPONSE MODELS
    // ==========================================

    public class CrearEntregaRequest
    {
        public int TareaId { get; set; }
        public string? ComentarioEstudiante { get; set; }
        public IFormFile? ArchivoEntrega { get; set; }
    }

    public class CalificarRequest
    {
        public double Calificacion { get; set; }
        public string? RetroalimentacionDocente { get; set; }
    }

    public class EntregaResponse
    {
        public int Id { get; set; }
        public int TareaId { get; set; }
        public string EstudianteId { get; set; } = string.Empty;
        public string NombreEstudiante { get; set; } = string.Empty;
        public DateTime FechaEntrega { get; set; }
        public string? ComentarioEstudiante { get; set; }
        public string? RutaArchivo { get; set; }
        public string? NombreArchivoOriginal { get; set; }
        public double? Calificacion { get; set; }
        public string? RetroalimentacionDocente { get; set; }
        public DateTime? FechaCalificacion { get; set; }
    }

    public class MisEntregasResponse
    {
        public int Id { get; set; }
        public int TareaId { get; set; }
        public string TituloTarea { get; set; } = string.Empty;
        public DateTime FechaLimite { get; set; }
        public DateTime FechaEntrega { get; set; }
        public double? Calificacion { get; set; }
        public string? Retroalimentacion { get; set; }
        public string? NombreArchivo { get; set; }
    }
}