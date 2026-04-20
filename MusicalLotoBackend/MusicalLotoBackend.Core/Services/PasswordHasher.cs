using MusicalLotoBackend.Domain.Models;

namespace MusicalLotoBackend.Core.Services;

public interface IPasswordHasher
{
    string Generate(string password);
    bool Verify(string password, string hashedPassword);
}

public class PasswordHasher : IPasswordHasher
{
    public string Generate(string password)
    {
        return BCrypt.Net.BCrypt.EnhancedHashPassword(password);
    }

    public bool Verify(string password, string hashedPassword)
    {
        return BCrypt.Net.BCrypt.EnhancedVerify(password, hashedPassword);
    }
}
