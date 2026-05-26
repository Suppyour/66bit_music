using MediatR;
using MusicalLotoBackend.Database;

namespace MusicalLotoBackend.Core.Features.Users;

public class DeleteAccountCommand : IRequest<bool>
{
    public Guid UserId { get; init; }
}

public class DeleteAccountHandler : IRequestHandler<DeleteAccountCommand, bool>
{
    private readonly AppDbContext _dbContext;

    public DeleteAccountHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(DeleteAccountCommand request, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
        if (user == null) return false;

        _dbContext.Users.Remove(user);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
