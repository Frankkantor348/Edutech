using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;

namespace Tareas.Controllers.Api
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AsignaturasController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public AsignaturasController(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        [HttpGet]
        public IActionResult GetAsignaturas()
        {
            var asignaturas = new[]
            {
        new { Id = 1, Nombre = "Matemáticas", DocenteId = "32d921cb-a949-4d9a-8580-fb40046bd809" },
        new { Id = 2, Nombre = "Sociales", DocenteId = "32d921cb-a949-4d9a-8580-fb40046bd809" },
        new { Id = 3, Nombre = "Lenguaje", DocenteId = "32d921cb-a949-4d9a-8580-fb40046bd809" }
    };
            return Ok(asignaturas);
        }
    }
            }

    