namespace Tareas.Models;
public class Asignatura
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string DocenteId { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; }
}