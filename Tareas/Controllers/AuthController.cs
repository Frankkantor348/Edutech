// Controllers/Api/AuthController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Tareas.Data;
using Tareas.Models;  // ← IMPORTANTE: Para usar ApplicationUser

namespace Tareas.Controllers.Api
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        // Cambiado: Usar ApplicationUser en lugar de IdentityUser
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _context;

        public AuthController(
            UserManager<ApplicationUser> userManager,      // Cambiado 
            SignInManager<ApplicationUser> signInManager,  // Cambiado
            RoleManager<IdentityRole> roleManager,
            IConfiguration configuration,
            ApplicationDbContext context)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _context = context;
        }

        // ==========================================
        // ENDPOINT: POST api/auth/login
        // ==========================================
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // Buscar usuario por email
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
                return Unauthorized(new { mensaje = "Credenciales inválidas" });

            // Verificar contraseña
            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            if (!result.Succeeded)
                return Unauthorized(new { mensaje = "Credenciales inválidas" });

            // Obtener roles del usuario
            var roles = await _userManager.GetRolesAsync(user);

            // Generar token JWT
            var token = GenerarTokenJWT(user, roles);

            return Ok(new LoginResponse
            {
                Token = token,
                Email = user.Email ?? string.Empty,
                Nombre = user.NombreCompleto ?? user.UserName ?? string.Empty,  // Usa NombreCompleto
                Rol = roles.FirstOrDefault() ?? "Estudiante",
                Expiracion = DateTime.UtcNow.AddHours(8)
            });
        }

        // ==========================================
        // ENDPOINT: POST api/auth/register
        // ==========================================
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            // Verificar si el usuario ya existe
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
                return BadRequest(new { mensaje = "El correo ya está registrado" });

            // Crear usuario con ApplicationUser (incluye NombreCompleto)
            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                PhoneNumber = request.Telefono,
                EmailConfirmed = true,
                NombreCompleto = request.Email?.Split('@')[0] ?? ""  // Nombre inicial desde email
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                var errores = result.Errors.Select(e => e.Description);
                return BadRequest(new { mensaje = "Error al registrar", errores });
            }

            // Asignar rol (Estudiante o Docente)
            var rol = request.Rol ?? "Estudiante";

            // Crear rol si no existe
            if (!await _roleManager.RoleExistsAsync(rol))
                await _roleManager.CreateAsync(new IdentityRole(rol));

            await _userManager.AddToRoleAsync(user, rol);

            return Ok(new { mensaje = "Usuario registrado exitosamente", email = user.Email, rol });
        }

        // ==========================================
        // ENDPOINT: GET api/auth/current-user
        // ==========================================
        [HttpGet("current-user")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return Unauthorized();

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new CurrentUserResponse
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                Nombre = user.NombreCompleto ?? user.UserName ?? string.Empty,  // Prioriza NombreCompleto
                Telefono = user.PhoneNumber ?? string.Empty,
                Rol = roles.FirstOrDefault() ?? "Estudiante",
                FechaRegistro = user.LockoutEnd?.UtcDateTime ?? DateTime.UtcNow
            });
        }

        // ==========================================
        // ENDPOINT: PUT api/auth/actualizar-perfil
        // ==========================================
        [HttpPut("actualizar-perfil")]
        [Authorize]
        public async Task<IActionResult> ActualizarPerfil([FromBody] ActualizarPerfilRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return NotFound(new { mensaje = "Usuario no encontrado" });

            // Actualizar teléfono si se proporciona
            if (request.Telefono != null)
                user.PhoneNumber = request.Telefono;

            // Actualizar nombre completo (permite espacios, tildes, etc.)
            if (!string.IsNullOrWhiteSpace(request.Nombre))
                user.NombreCompleto = request.Nombre;

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                var errores = result.Errors.Select(e => e.Description);
                return BadRequest(new { mensaje = "Error al actualizar el perfil", errores });
            }

            return Ok(new { mensaje = "Perfil actualizado exitosamente" });
        }

        // ==========================================
        // MÉTODO PRIVADO: Generar Token JWT
        // ==========================================
        private string GenerarTokenJWT(ApplicationUser user, IList<string> roles)  // Cambiado a ApplicationUser
        {
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim(ClaimTypes.Name, user.NombreCompleto ?? user.UserName ?? string.Empty)  // Usa NombreCompleto
            };

            // Agregar roles como claims
            foreach (var rol in roles)
                claims.Add(new Claim(ClaimTypes.Role, rol));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "MiClaveSecretaSuperSegura123456789"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"] ?? "TareasApp",
                audience: _configuration["Jwt:Audience"] ?? "TareasAppClient",
                claims: claims,
                expires: DateTime.Now.AddHours(8),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    // ==========================================
    // REQUEST / RESPONSE MODELS
    // ==========================================

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginResponse
    {
        public string Token { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
        public DateTime Expiracion { get; set; }
    }

    public class RegisterRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? Telefono { get; set; }
        public string? Rol { get; set; }
    }

    public class CurrentUserResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
        public DateTime FechaRegistro { get; set; }
    }

    // Request para actualizar perfil
    public class ActualizarPerfilRequest
    {
        public string? Telefono { get; set; }
        public string? Nombre { get; set; }
    }
}