using MediatR;
using Microsoft.AspNetCore.Http;

namespace MusicalLotoBackend.Core.Features.PDF;

public class GeneratePdfArchiveCommand : IRequest<byte[]>
{
    public required string HtmlCards { get; set; } // JSON array of HTML strings
    public bool IsSingle { get; set; } = false;
}
