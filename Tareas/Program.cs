using Tareas.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Tareas.Data;
using Microsoft.Extensions.FileProviders;

namespace Tareas
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // ==========================================
            // CONFIGURACIÓN DE SERVICIOS
            // ==========================================

            // Leer conexión desde VARIABLE DE ENTORNO (Azure App Settings)
            var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION")
                ?? builder.Configuration.GetConnectionString("ConexionSQL")
                ?? throw new InvalidOperationException("Connection string 'DB_CONNECTION' or 'ConexionSQL' not found.");

            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString, sqlOptions =>
                    sqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(30),
                        errorNumbersToAdd: null)));

            // Identity con ApplicationUser
            builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
            {
                options.SignIn.RequireConfirmedAccount = false;
                options.Password.RequireDigit = true;
                options.Password.RequiredLength = 6;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireLowercase = true;
                options.User.RequireUniqueEmail = true;
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

            // JWT - Leer desde variable de entorno o configuración
            var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") 
                ?? builder.Configuration["Jwt:Key"] 
                ?? "MiClaveSecretaSuperSeguraParaJWT123456789!!!";
            var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") 
                ?? builder.Configuration["Jwt:Issuer"] 
                ?? "TareasApp";
            var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") 
                ?? builder.Configuration["Jwt:Audience"] 
                ?? "TareasAppClient";

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                    ClockSkew = TimeSpan.Zero
                };
            });

            // ==========================================
            // CONFIGURACIÓN DE CORS PARA AZURE STORAGE
            // ==========================================
            var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") 
                ?? "https://edutechfrontapp.z47.web.core.windows.net";

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", policy =>
                {
                    if (builder.Environment.IsDevelopment())
                    {
                        // Desarrollo: permitir Angular local
                        policy.WithOrigins("http://localhost:4200")
                              .AllowAnyMethod()
                              .AllowAnyHeader()
                              .AllowCredentials();
                    }
                    else
                    {
                        // Producción: permitir el frontend en Azure Storage
                        policy.WithOrigins(frontendUrl)
                              .AllowAnyMethod()
                              .AllowAnyHeader()
                              .AllowCredentials();
                    }
                });
            });

            builder.Services.AddControllers();

            var app = builder.Build();

            // ==========================================
            // CREAR BASE DE DATOS (si no existe)
            // ==========================================
            using (var scope = app.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                await dbContext.Database.EnsureCreatedAsync();
            }

            // ==========================================
            // INICIALIZACIÓN DE DATOS (Roles y usuarios)
            // ==========================================
            using (var scope = app.Services.CreateScope())
            {
                var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

                string[] roles = { "Docente", "Estudiante" };
                foreach (var role in roles)
                {
                    if (!await roleManager.RoleExistsAsync(role))
                        await roleManager.CreateAsync(new IdentityRole(role));
                }

                string docenteEmail = "docente@edutech.com";
                if (await userManager.FindByEmailAsync(docenteEmail) == null)
                {
                    var docente = new ApplicationUser
                    {
                        UserName = docenteEmail,
                        Email = docenteEmail,
                        EmailConfirmed = true,
                        PhoneNumber = "3001234567",
                        NombreCompleto = "Docente"
                    };
                    await userManager.CreateAsync(docente, "Docente123!");
                    await userManager.AddToRoleAsync(docente, "Docente");
                }

                string estudianteEmail = "estudiante@edutech.com";
                if (await userManager.FindByEmailAsync(estudianteEmail) == null)
                {
                    var estudiante = new ApplicationUser
                    {
                        UserName = estudianteEmail,
                        Email = estudianteEmail,
                        EmailConfirmed = true,
                        PhoneNumber = "3007654321",
                        NombreCompleto = "Estudiante"
                    };
                    await userManager.CreateAsync(estudiante, "Estudiante123!");
                    await userManager.AddToRoleAsync(estudiante, "Estudiante");
                }
            }

            // ==========================================
            // PIPELINE HTTP
            // ==========================================

            if (app.Environment.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            // Usar CORS
            app.UseCors("AllowFrontend");

            // Servir archivos estáticos (si existen)
            var wwwrootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            if (!Directory.Exists(wwwrootPath))
            {
                Directory.CreateDirectory(wwwrootPath);
            }

            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(wwwrootPath),
                RequestPath = ""
            });

            app.UseAuthentication();
            app.UseAuthorization();
            app.MapControllers();

            // Health check
            app.MapGet("/api/health", () => Results.Ok(new
            {
                status = "OK",
                timestamp = DateTime.UtcNow,
                message = "EduTech API funcionando en Azure"
            })).AllowAnonymous();

            app.Run();
        }
    }
}