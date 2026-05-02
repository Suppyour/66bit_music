namespace MusicalLotoBackend.Domain.Models;

public class User : BaseEntity
{
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public required string Name{ get; set; }
    public required string SurName { get; set; }
}
