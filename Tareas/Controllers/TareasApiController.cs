using Microsoft.AspNetCore.Authorization;
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
    public class TareasApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public TareasApiController(ApplicationDbContext context, IWebHostEnvironment webHostEnvironment)
        {
            _context = context;
            _webHostEnvironment = webHostEnvironment;
        }

        // ==========================================
        // ENDPOINTS GET
        // ==========================================

        // GET: api/tareas
        [HttpGet]
        public async Task<IActionResult> GetTareas()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var esDocente = User.IsInRole("Docente");

                List<Tarea> tareas;

                if (esDocente)
                {
                    tareas = await _context.Tareas
                        .Where(t => t.DocenteId == userId)
                        .OrderByDescending(t => t.FechaPublicacion)
                        .ToListAsync();
                }
                else
                {
                    tareas = await _context.Tareas
                        .OrderBy(t => t.FechaLimite)
                        .ToListAsync();
                }

                var entregas = new Dictionary<int, Entrega>();
                if (!esDocente)
                {
                    entregas = await _context.Entregas
                        .Where(e => e.EstudianteId == userId)
                        .ToDictionaryAsync(e => e.TareaId, e => e);
                }

                var response = tareas.Select(t => new TareaResponse
                {
                    Id = t.Id,
                    Titulo = t.Titulo,
                    Descripcion = t.Descripcion,
                    FechaPublicacion = t.FechaPublicacion,
                    FechaLimite = t.FechaLimite,
                    ColorSemaforo = t.ColorSemaforo,
                    Curso = t.Curso,
                    DocenteId = t.DocenteId,
                    RutaArchivoApoyo = t.RutaArchivoApoyo,
                    NombreArchivoApoyo = t.NombreArchivoApoyo,
                    Entregada = !esDocente && entregas.ContainsKey(t.Id),
                    FechaEntrega = !esDocente && entregas.ContainsKey(t.Id) ? entregas[t.Id].FechaEntrega : null,  // ✅ Agregar esta línea
                    Calificacion = !esDocente && entregas.ContainsKey(t.Id) ? entregas[t.Id].Calificacion : null,
                    Retroalimentacion = !esDocente && entregas.ContainsKey(t.Id) ? entregas[t.Id].RetroalimentacionDocente : null,
                    Asignatura = null,
                    TotalEntregas = esDocente ? _context.Entregas.Count(e => e.TareaId == t.Id) : 0,
                    EntregasCalificadas = esDocente ? _context.Entregas.Count(e => e.TareaId == t.Id && e.Calificacion != null) : 0
                });
                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR en GetTareas: {ex.Message}");
                return StatusCode(500, new { mensaje = "Error al obtener tareas", error = ex.Message });
            }
        }

        // GET: api/tareas/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTarea(int id)
        {
            try
            {
                var tarea = await _context.Tareas
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (tarea == null)
                    return NotFound(new { mensaje = "Tarea no encontrada" });

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var esDocente = User.IsInRole("Docente");

                Entrega? entrega = null;
                if (!esDocente)
                {
                    entrega = await _context.Entregas
                        .FirstOrDefaultAsync(e => e.TareaId == id && e.EstudianteId == userId);
                }

                var response = new TareaDetalleResponse
                {
                    Id = tarea.Id,
                    Titulo = tarea.Titulo,
                    Descripcion = tarea.Descripcion,
                    FechaPublicacion = tarea.FechaPublicacion,
                    FechaLimite = tarea.FechaLimite,
                    ColorSemaforo = tarea.ColorSemaforo,
                    Curso = tarea.Curso,
                    DocenteId = tarea.DocenteId,
                    RutaArchivoApoyo = tarea.RutaArchivoApoyo,
                    NombreArchivoApoyo = tarea.NombreArchivoApoyo,
                    Entregada = entrega != null,
                    FechaEntrega = entrega?.FechaEntrega,
                    Calificacion = entrega?.Calificacion,
                    Retroalimentacion = entrega?.RetroalimentacionDocente,
                    ComentarioEstudiante = entrega?.ComentarioEstudiante,
                    Asignatura = null
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR en GetTarea: {ex.Message}");
                return StatusCode(500, new { mensaje = "Error al obtener tarea", error = ex.Message });
            }
        }

        // ==========================================
        // ENDPOINTS POST - CREAR TAREA
        // ==========================================

        // POST: api/tareas (JSON - sin archivo)
        [HttpPost("json")]
        [Authorize(Roles = "Docente")]
        public async Task<IActionResult> CrearTareaJson([FromBody] CrearTareaJsonRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                var tarea = new Tarea
                {
                    Titulo = request.Titulo,
                    Descripcion = request.Descripcion,
                    FechaPublicacion = DateTime.Now,
                    FechaLimite = request.FechaLimite,
                    ColorSemaforo = CalcularColorSemaforo(request.FechaLimite),
                    Curso = request.Curso,
                    DocenteId = userId,
                    RutaArchivoApoyo = null,
                    NombreArchivoApoyo = null,
                    TipoArchivoApoyo = null
                };

                _context.Tareas.Add(tarea);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    mensaje = "Tarea creada exitosamente",
                    tareaId = tarea.Id,
                    tarea = new TareaResponse
                    {
                        Id = tarea.Id,
                        Titulo = tarea.Titulo,
                        Descripcion = tarea.Descripcion,
                        FechaPublicacion = tarea.FechaPublicacion,
                        FechaLimite = tarea.FechaLimite,
                        ColorSemaforo = tarea.ColorSemaforo,
                        Curso = tarea.Curso
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR en CrearTareaJson: {ex.Message}");
                return StatusCode(500, new { mensaje = "Error al crear tarea", error = ex.Message });
            }
        }

        // POST: api/tareas/form (FormData - con archivo)
        [HttpPost("form")]
        [Authorize(Roles = "Docente")]
        public async Task<IActionResult> CrearTareaForm([FromForm] CrearTareaFormRequest request)
        {
            try
            {
                Console.WriteLine("=== CREAR TAREA FORM ===");
                Console.WriteLine($"Titulo: {request.Titulo}");
                Console.WriteLine($"Descripcion: {request.Descripcion}");
                Console.WriteLine($"FechaLimite: {request.FechaLimite}");
                Console.WriteLine($"Curso: {request.Curso}");
                Console.WriteLine($"AsignaturaId: {request.AsignaturaId}");

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                string? rutaArchivo = null;
                string? nombreArchivo = null;
                string? tipoArchivo = null;

                if (request.ArchivoApoyo != null && request.ArchivoApoyo.Length > 0)
                {
                    var extension = Path.GetExtension(request.ArchivoApoyo.FileName).ToLower();
                    var extensionesPermitidas = new[] { ".pdf", ".doc", ".docx", ".jpg", ".png", ".zip" };

                    if (!extensionesPermitidas.Contains(extension))
                        return BadRequest(new { mensaje = "Tipo de archivo no permitido" });

                    if (request.ArchivoApoyo.Length > 10 * 1024 * 1024)
                        return BadRequest(new { mensaje = "El archivo no puede superar los 10MB" });

                    nombreArchivo = $"{Guid.NewGuid()}{extension}";
                    tipoArchivo = request.ArchivoApoyo.ContentType;

                    var carpeta = Path.Combine("uploads", "tareas", "apoyo");
                    var rutaCarpeta = Path.Combine(_webHostEnvironment.WebRootPath, carpeta);

                    if (!Directory.Exists(rutaCarpeta))
                        Directory.CreateDirectory(rutaCarpeta);

                    var rutaCompleta = Path.Combine(rutaCarpeta, nombreArchivo);
                    using (var stream = new FileStream(rutaCompleta, FileMode.Create))
                    {
                        await request.ArchivoApoyo.CopyToAsync(stream);
                    }

                    rutaArchivo = Path.Combine("/", carpeta, nombreArchivo).Replace("\\", "/");
                }

                var tarea = new Tarea
                {
                    Titulo = request.Titulo,
                    Descripcion = request.Descripcion,
                    FechaPublicacion = DateTime.Now,
                    FechaLimite = request.FechaLimite,
                    ColorSemaforo = CalcularColorSemaforo(request.FechaLimite),
                    Curso = request.Curso,
                    DocenteId = userId,
                    RutaArchivoApoyo = rutaArchivo,
                    NombreArchivoApoyo = request.ArchivoApoyo?.FileName,
                    TipoArchivoApoyo = tipoArchivo
                };

                _context.Tareas.Add(tarea);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    mensaje = "Tarea creada exitosamente con archivo",
                    tareaId = tarea.Id
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR en CrearTareaForm: {ex.Message}");
                Console.WriteLine($"STACK: {ex.StackTrace}");
                return StatusCode(500, new { mensaje = ex.Message });
            }
        }

        // ==========================================
        // ENDPOINTS PUT - ACTUALIZAR TAREA
        // ==========================================

        // PUT: api/tareas/{id}/json
        [HttpPut("{id}/json")]
        [Authorize(Roles = "Docente")]
        public async Task<IActionResult> ActualizarTareaJson(int id, [FromBody] ActualizarTareaJsonRequest request)
        {
            try
            {
                var tarea = await _context.Tareas.FindAsync(id);
                if (tarea == null)
                    return NotFound(new { mensaje = "Tarea no encontrada" });

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (tarea.DocenteId != userId)
                    return Forbid();

                tarea.Titulo = request.Titulo;
                tarea.Descripcion = request.Descripcion;
                tarea.FechaLimite = request.FechaLimite;
                tarea.ColorSemaforo = CalcularColorSemaforo(request.FechaLimite);
                tarea.Curso = request.Curso;

                await _context.SaveChangesAsync();
                return Ok(new { mensaje = "Tarea actualizada exitosamente" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR en ActualizarTareaJson: {ex.Message}");
                return StatusCode(500, new { mensaje = "Error al actualizar tarea", error = ex.Message });
            }
        }

        // PUT: api/tareas/{id}/form
        [HttpPut("{id}/form")]
        [Authorize(Roles = "Docente")]
        public async Task<IActionResult> ActualizarTareaForm(int id, [FromForm] ActualizarTareaFormRequest request)
        {
            try
            {
                var tarea = await _context.Tareas.FindAsync(id);
                if (tarea == null)
                    return NotFound(new { mensaje = "Tarea no encontrada" });

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (tarea.DocenteId != userId)
                    return Forbid();

                tarea.Titulo = request.Titulo;
                tarea.Descripcion = request.Descripcion;
                tarea.FechaLimite = request.FechaLimite;
                tarea.ColorSemaforo = CalcularColorSemaforo(request.FechaLimite);
                tarea.Curso = request.Curso;

                if (request.ArchivoApoyo != null && request.ArchivoApoyo.Length > 0)
                {
                    // Eliminar archivo viejo
                    if (!string.IsNullOrEmpty(tarea.RutaArchivoApoyo))
                    {
                        var rutaVieja = Path.Combine(_webHostEnvironment.WebRootPath, tarea.RutaArchivoApoyo.TrimStart('/'));
                        if (System.IO.File.Exists(rutaVieja))
                            System.IO.File.Delete(rutaVieja);
                    }

                    var extension = Path.GetExtension(request.ArchivoApoyo.FileName).ToLower();
                    var nombreArchivo = $"{Guid.NewGuid()}{extension}";
                    var carpeta = Path.Combine("uploads", "tareas", "apoyo");
                    var rutaCarpeta = Path.Combine(_webHostEnvironment.WebRootPath, carpeta);

                    if (!Directory.Exists(rutaCarpeta))
                        Directory.CreateDirectory(rutaCarpeta);

                    var rutaCompleta = Path.Combine(rutaCarpeta, nombreArchivo);
                    using (var stream = new FileStream(rutaCompleta, FileMode.Create))
                    {
                        await request.ArchivoApoyo.CopyToAsync(stream);
                    }

                    tarea.RutaArchivoApoyo = Path.Combine("/", carpeta, nombreArchivo).Replace("\\", "/");
                    tarea.NombreArchivoApoyo = request.ArchivoApoyo.FileName;
                    tarea.TipoArchivoApoyo = request.ArchivoApoyo.ContentType;
                }

                await _context.SaveChangesAsync();
                return Ok(new { mensaje = "Tarea actualizada exitosamente" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR en ActualizarTareaForm: {ex.Message}");
                return StatusCode(500, new { mensaje = "Error al actualizar tarea", error = ex.Message });
            }
        }

        // ==========================================
        // ENDPOINTS DELETE
        // ==========================================

        // DELETE: api/tareas/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Docente")]
        public async Task<IActionResult> EliminarTarea(int id)
        {
            try
            {
                var tarea = await _context.Tareas
                    .Include(t => t.Entregas)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (tarea == null)
                    return NotFound(new { mensaje = "Tarea no encontrada" });

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (tarea.DocenteId != userId)
                    return Forbid();

                // Eliminar archivos de entregas
                foreach (var entrega in tarea.Entregas)
                {
                    if (!string.IsNullOrEmpty(entrega.RutaArchivo))
                    {
                        var rutaArchivo = Path.Combine(_webHostEnvironment.WebRootPath, entrega.RutaArchivo.TrimStart('/'));
                        if (System.IO.File.Exists(rutaArchivo))
                            System.IO.File.Delete(rutaArchivo);
                    }
                }

                // Eliminar archivo de apoyo
                if (!string.IsNullOrEmpty(tarea.RutaArchivoApoyo))
                {
                    var rutaApoyo = Path.Combine(_webHostEnvironment.WebRootPath, tarea.RutaArchivoApoyo.TrimStart('/'));
                    if (System.IO.File.Exists(rutaApoyo))
                        System.IO.File.Delete(rutaApoyo);
                }

                _context.Tareas.Remove(tarea);
                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Tarea eliminada exitosamente" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR en EliminarTarea: {ex.Message}");
                return StatusCode(500, new { mensaje = "Error al eliminar tarea", error = ex.Message });
            }
        }

        // ==========================================
        // MÉTODOS PRIVADOS
        // ==========================================

        private string CalcularColorSemaforo(DateTime fechaLimite)
        {
            var diasRestantes = (fechaLimite - DateTime.Now).Days;

            if (diasRestantes < 0)
                return "rojo";
            else if (diasRestantes <= 2)
                return "amarillo";
            else
                return "verde";
        }
    }

    // ==========================================
    // REQUEST MODELS
    // ==========================================

    public class CrearTareaJsonRequest
    {
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public DateTime FechaLimite { get; set; }
        public string? Curso { get; set; }
        public int? AsignaturaId { get; set; }
    }

    public class CrearTareaFormRequest
    {
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public DateTime FechaLimite { get; set; }
        public string? Curso { get; set; }
        public int? AsignaturaId { get; set; }
        public IFormFile? ArchivoApoyo { get; set; }
    }

    public class ActualizarTareaJsonRequest
    {
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public DateTime FechaLimite { get; set; }
        public string? Curso { get; set; }
        public int? AsignaturaId { get; set; }
    }

    public class ActualizarTareaFormRequest
    {
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public DateTime FechaLimite { get; set; }
        public string? Curso { get; set; }
        public int? AsignaturaId { get; set; }
        public IFormFile? ArchivoApoyo { get; set; }
    }

    // ==========================================
    // RESPONSE MODELS
    // ==========================================

    public class AsignaturaDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
    }

    public class TareaResponse
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public DateTime FechaPublicacion { get; set; }
        public DateTime FechaLimite { get; set; }
        public string? ColorSemaforo { get; set; }
        public string? Curso { get; set; }
        public string DocenteId { get; set; } = string.Empty;
        public string? RutaArchivoApoyo { get; set; }
        public string? NombreArchivoApoyo { get; set; }
        public bool Entregada { get; set; }
        public double? Calificacion { get; set; }
        public string? Retroalimentacion { get; set; }
        public AsignaturaDto? Asignatura { get; set; }
        public DateTime? FechaEntrega { get; set; }
        // Nuevos campos para docente
        public int TotalEntregas { get; set; }
        public int EntregasCalificadas { get; set; }
    }

    public class TareaDetalleResponse : TareaResponse
    {
        public DateTime? FechaEntrega { get; set; }
        public string? ComentarioEstudiante { get; set; }
    }
}