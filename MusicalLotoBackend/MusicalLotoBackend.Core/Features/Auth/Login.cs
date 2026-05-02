using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MusicalLotoBackend.Core.Services;
using MusicalLotoBackend.Database;

namespace MusicalLotoBackend.Core.Features.Auth;

public class LoginCommand : IRequest<string>
{
    public required string Email { get; set; }
    public required string Password { get; set; }
}

public class LoginValidator : AbstractValidator<LoginCommand>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class LoginHandler : IRequestHandler<LoginCommand, string>
{
    private readonly AppDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtProvider _jwtProvider;

    public LoginHandler(AppDbContext context, IPasswordHasher passwordHasher, IJwtProvider jwtProvider)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtProvider = jwtProvider;
    }

    public async Task<string> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);
        if (user == null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new Exception("Неверный логин или пароль");
        }

        return _jwtProvider.GenerateToken(user);
    }
}
