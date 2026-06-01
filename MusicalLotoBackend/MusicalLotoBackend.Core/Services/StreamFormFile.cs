using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace MusicalLotoBackend.Core.Services;

public class StreamFormFile : IFormFile
{
    private readonly Stream _stream;

    public StreamFormFile(Stream stream, string name, string fileName, string contentType)
    {
        _stream = stream;
        Name = name;
        FileName = fileName;
        ContentType = contentType;
        Length = stream.Length;
    }

    public string ContentType { get; }
    public string ContentDisposition => $"form-data; name=\"{Name}\"; filename=\"{FileName}\"";
    public IHeaderDictionary Headers => new HeaderDictionary();
    public long Length { get; }
    public string Name { get; }
    public string FileName { get; }

    public Stream OpenReadStream()
    {
        if (_stream.CanSeek)
        {
            _stream.Position = 0;
        }
        return _stream;
    }

    public void CopyTo(Stream target)
    {
        if (_stream.CanSeek)
        {
            _stream.Position = 0;
        }
        _stream.CopyTo(target);
    }

    public Task CopyToAsync(Stream target, CancellationToken cancellationToken = default)
    {
        if (_stream.CanSeek)
        {
            _stream.Position = 0;
        }
        return _stream.CopyToAsync(target, cancellationToken);
    }
}
