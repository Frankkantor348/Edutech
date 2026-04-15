📚 EduTech - Plataforma de Gestión de Tareas Académicas
  
    EduTech  es una plataforma educativa que optimiza el proceso de asignación, entrega y evaluación de tareas académicas, mejorando la organización, el seguimiento y la retroalimentación en entornos educativos.

🎯 Objetivo del Proyecto

    Proporcionar una herramienta digital que optimice el proceso de asignación, entrega y evaluación de tareas académicas, mejorando la           organización, el seguimiento y la retroalimentación en entornos educativos.
✨ Características Principales
👨‍🏫 Módulo Docente

- ✅ Creación, edición y eliminación de tareas académicas
- ✅ Asignación de fechas límite y cursos
- ✅ Visualización de entregas por tarea
- ✅ Calificación y retroalimentación personalizada
- ✅ Descarga de archivos entregados por estudiantes
- ✅ Gestión de asignaturas

👨‍🎓 Módulo Estudiante

- ✅ Visualización de tareas asignadas con semáforos (verde/amarillo/rojo)
- ✅ Entrega de tareas mediante subida de archivos
- ✅ Consulta de calificaciones y retroalimentación
- ✅ Historial de entregas realizadas
- ✅ Filtros por estado (pendientes, entregadas, calificadas, vencidas)

🔐 Características Generales

- ✅ Autenticación segura con ASP.NET Core Identity + JWT
- ✅ Roles diferenciados (Docente/Estudiante)
- ✅ Interfaz responsive con Bootstrap 5
- ✅ Notificaciones toast (ngx-toastr)
- ✅ Validaciones en todos los formularios
- ✅ Confirmación antes de eliminar tareas
- ✅ Dashboard con estadísticas por rol

🛠️ Tecnologías Utilizadas

   ### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **ASP.NET Core** | .NET 8 | Framework principal para la API REST |
| **Entity Framework Core** | 8.x | ORM para acceso a datos |
| **SQL Server** | LocalDB / 2022 | Base de datos relacional |
| **ASP.NET Core Identity** | 8.x | Autenticación y gestión de usuarios |
| **JWT (JSON Web Tokens)** | - | Autenticación sin estado |
| **Swagger/OpenAPI** | - | Documentación de API (opcional) |

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Angular** | 21.x | Framework principal del frontend |
| **TypeScript** | 5.x | Lenguaje de programación |
| **RxJS** | 7.x | Programación reactiva |
| **Bootstrap** | 5.3 | Diseño responsive y componentes UI |
| **Bootstrap Icons** | 1.11 | Íconos para la interfaz |
| **ngx-toastr** | - | Notificaciones emergentes |

### Herramientas de Desarrollo
- **Visual Studio 2022** - IDE para backend
- **VS Code** - IDE para frontend
- **Git / GitHub** - Control de versiones
- **Postman** - Pruebas de API


## 🚀 Cómo Ejecutar el Proyecto

### Requisitos Previos
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [SQL Server LocalDB](https://docs.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb) o SQL Server
- [Angular CLI](https://angular.io/cli) (`npm install -g @angular/cli`)

### Backend (API)

```bash
# Clonar el repositorio
git clone https://github.com/Frankkantor348/EduTech.git
cd EduTech/Tareas

# Configurar User Secrets (para desarrollo)
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:ConexionSQL" "Server=(localdb)\\mssqllocaldb;Database=Tareas;Trusted_Connection=True"
dotnet user-secrets set "Jwt:Key" "TuClaveSecretaSuperSegura"

# Ejecutar migraciones
dotnet ef database update

# Ejecutar la API
dotnet run --launch-profile http
La API estará disponible en: http://localhost:5279

# Ir a la carpeta del frontend
cd ../frontend/tareas-app

# Instalar dependencias
npm install

# Ejecutar la aplicación
ng serve -o

La aplicación estará disponible en: http://localhost:4200
Credenciales de Prueba
Rol
👨‍🏫 Docente	docente@edutech.com	Docente123!
👨‍🎓 Estudiante	estudiante@edutech.com	Estudiante123!

📋 Endpoints Principales de la API

POST	/api/auth/login	Iniciar sesión
POST	/api/auth/register	Registrar usuario
GET	/api/dashboard	Obtener estadísticas del dashboard
GET	/api/TareasApi	Listar tareas
POST	/api/TareasApi/form	Crear tarea (con archivo)
PUT	/api/TareasApi/{id}/form	Editar tarea (con archivo)
DELETE	/api/TareasApi/{id}	Eliminar tarea
POST	/api/EntregasApi	Entregar tarea (estudiante)
PUT	/api/EntregasApi/{id}/calificar	Calificar entrega (docente)
GET	/api/EntregasApi/tarea/{tareaId}	Ver entregas por tarea (docente)


🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

    Haz fork del proyecto

    Crea una rama para tu feature (git checkout -b feature/NuevaFuncionalidad)

    Haz commit de tus cambios (git commit -m 'Agrega nueva funcionalidad')

    Haz push a la rama (git push origin feature/NuevaFuncionalidad)

    Abre un Pull Request

 📄 Licencia

    Este proyecto está bajo la **Licencia MIT**.  
    Copyright (c) 2026 **Franklin Gutiérrez**
    
     Consulta el archivo [LICENSE](LICENSE) para más detalles.

🙏 Agradecimientos

    A la Corporación Universitaria Iberoamericana

    Al equipo docente del curso de Análisis y Diseño de Sistemas

    A la comunidad de desarrolladores de ASP.NET Core y Angular

👨‍💻 Autores
Franklin Gutiérrez
Camila ochoa
Daisy Malagón
Valentina Lopez
Daniela Camacho


    GitHub: @Frankkantor348


   EduTech © 2026 - Transformando la educación a través de la tecnología 🚀



    
