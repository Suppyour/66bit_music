using MediatR;
using Microsoft.EntityFrameworkCore;
using MusicalLotoBackend.Database;

namespace MusicalLotoBackend.Core.Features.Users;

public class UserProfileDto
{
    public Guid Id { get; init; }
    public string Email { get; init; }
    public string Name { get; init; }
    public string SurName { get; init; }
}

public class GetProfileQuery : IRequest<UserProfileDto?>
{
    public Guid UserId { get; init; }
}

public class GetProfileHandler : IRequestHandler<GetProfileQuery, UserProfileDto?>
{
    private readonly AppDbContext _dbContext;

    public GetProfileHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<UserProfileDto?> Handle(GetProfileQuery request, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null) return null;

        return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
            SurName = user.SurName
        };
    }
}
