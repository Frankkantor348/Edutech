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

            var connectionString = builder.Configuration.GetConnectionString("ConexionSQL")
                ?? throw new InvalidOperationException("Connection string 'ConexionSQL' not found.");

            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString, sqlOptions =>
                    sqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(30),
                        errorNumbersToAdd: null)));

            // CAMBIADO: Usar ApplicationUser en lugar de IdentityUser
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

            var jwtKey = builder.Configuration["Jwt:Key"] ?? "MiClaveSecretaSuperSeguraParaJWT123456789!!!";
            var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "TareasApp";
            var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "TareasAppClient";

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

            // configuración de CORS para permitir solicitudes desde Angular
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AngularPolicy", policy =>
                {
                    policy.WithOrigins("http://localhost:4200")
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .AllowCredentials();
                });
            });

            builder.Services.AddControllers();

            var app = builder.Build();

            // ==========================================
            // CREAR BASE DE DATOS
            // ==========================================
            using (var scope = app.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                await dbContext.Database.EnsureCreatedAsync();
            }

            // ==========================================
            // INICIALIZACIÓN DE DATOS
            // ==========================================
            using (var scope = app.Services.CreateScope())
            {
                var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
                // CAMBIADO: Usar ApplicationUser
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

            app.UseCors("AngularPolicy");
            // app.UseHttpsRedirection();

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

            app.MapGet("/api/health", () => Results.Ok(new
            {
                status = "OK",
                timestamp = DateTime.UtcNow,
                message = "EduTech API funcionando"
            })).AllowAnonymous();

            app.Run();
        }
    }
}