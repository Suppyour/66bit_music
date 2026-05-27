using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MusicalLotoBackend.Core.Services;
using MusicalLotoBackend.Database;

namespace MusicalLotoBackend.Core.Features.Auth;

public class ResetPasswordCommand : IRequest<Unit>
{
    public required string Email { get; set; }
    public required string NewPassword { get; set; }
}

public class ResetPasswordValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(6);
    }
}

public class ResetPasswordHandler : IRequestHandler<ResetPasswordCommand, Unit>
{
    private readonly AppDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public ResetPasswordHandler(AppDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<Unit> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);
        
        if (user == null)
        {
            throw new Exception("Пользователь с таким Email не найден");
        }

        user.PasswordHash = _passwordHasher.Generate(request.NewPassword);

        _context.Users.Update(user);
        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
