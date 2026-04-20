using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MusicalLotoBackend.Core.Services;
using MusicalLotoBackend.Database;
using MusicalLotoBackend.Domain.Models;

namespace MusicalLotoBackend.Core.Features.Auth;

public class RegisterCommand : IRequest<string>
{
    public required string Email { get; set; }
    public required string Password { get; set; }
}

public class RegisterValidator : AbstractValidator<RegisterCommand>
{
    public RegisterValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
    }
}

public class RegisterHandler : IRequestHandler<RegisterCommand, string>
{
    private readonly AppDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtProvider _jwtProvider;

    public RegisterHandler(AppDbContext context, IPasswordHasher passwordHasher, IJwtProvider jwtProvider)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtProvider = jwtProvider;
    }

    public async Task<string> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email, cancellationToken))
        {
            throw new Exception("User already exists");
        }

        var user = new User
        {
            Email = request.Email,
            PasswordHash = _passwordHasher.Generate(request.Password)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        return _jwtProvider.GenerateToken(user);
    }
}
