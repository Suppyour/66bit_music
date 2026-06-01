using MediatR;
using Microsoft.EntityFrameworkCore;
using MusicalLotoBackend.Database;
using MusicalLotoBackend.Core.Services;
using System.ComponentModel.DataAnnotations;

namespace MusicalLotoBackend.Core.Features.Users;

public class UpdateProfileCommand : IRequest<bool>
{
    public Guid UserId { get; set; }

    [Required(ErrorMessage = "Имя обязательно")]
    public required string Name { get; init; }

    [Required(ErrorMessage = "Фамилия обязательна")]
    public required string SurName { get; init; }

    [Required(ErrorMessage = "Email обязателен")]
    [EmailAddress(ErrorMessage = "Неверный формат Email")]
    public required string Email { get; init; }

    public string? Password { get; init; }
}

public class UpdateProfileHandler : IRequestHandler<UpdateProfileCommand, bool>
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;

    public UpdateProfileHandler(AppDbContext dbContext, IPasswordHasher passwordHasher)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
    }

    public async Task<bool> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
        if (user == null) return false;

        var emailExists = await _dbContext.Users
            .AnyAsync(u => u.Email.ToLower() == request.Email.ToLower() && u.Id != request.UserId, cancellationToken);

        if (emailExists)
        {
            throw new InvalidOperationException("Email уже занят другим пользователем");
        }

        user.Name = request.Name;
        user.SurName = request.SurName;
        user.Email = request.Email;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = _passwordHasher.Generate(request.Password);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
