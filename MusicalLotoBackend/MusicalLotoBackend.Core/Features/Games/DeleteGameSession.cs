using MediatR;
using MusicalLotoBackend.Database;

namespace MusicalLotoBackend.Core.Features.Games;

public class DeleteGameSession
{
    public class DeleteSessionCommand : IRequest<bool>
    {
        public required Guid Id { get; init; }
    }
    
    public class DeleteSessionHandler : IRequestHandler<DeleteSessionCommand, bool>
    {
        private readonly AppDbContext _dbContext;

        public DeleteSessionHandler(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<bool> Handle(DeleteSessionCommand request, CancellationToken cancellationToken)
        {
            var session = await _dbContext.Sessions.FindAsync(new object[] { request.Id }, cancellationToken);
            if (session == null) return false;
            _dbContext.Sessions.Remove(session);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}