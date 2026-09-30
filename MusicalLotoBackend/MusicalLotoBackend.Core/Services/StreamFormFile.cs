using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace MusicalLotoBackend.Core.Services;

public class StreamFormFile : IFormFile
{
    private readonly byte[] _bytes;

    public StreamFormFile(byte[] bytes, string name, string fileName, string contentType)
    {
        _bytes = bytes;
        Name = name;
        FileName = fileName;
        ContentType = contentType;
        Length = bytes.Length;
    }

    public StreamFormFile(Stream stream, string name, string fileName, string contentType)
    {
        if (stream is MemoryStream ms)
        {
            _bytes = ms.ToArray();
        }
        else
        {
            using var memoryStream = new MemoryStream();
            if (stream.CanSeek)
            {
                stream.Position = 0;
            }
            stream.CopyTo(memoryStream);
            _bytes = memoryStream.ToArray();
        }

        Name = name;
        FileName = fileName;
        ContentType = contentType;
        Length = _bytes.Length;
    }

    public string ContentType { get; }
    public string ContentDisposition => $"form-data; name=\"{Name}\"; filename=\"{FileName}\"";
    public IHeaderDictionary Headers => new HeaderDictionary();
    public long Length { get; }
    public string Name { get; }
    public string FileName { get; }

    public Stream OpenReadStream()
    {
        return new MemoryStream(_bytes, writable: false);
    }

    public void CopyTo(Stream target)
    {
        using var stream = OpenReadStream();
        stream.CopyTo(target);
    }

    public Task CopyToAsync(Stream target, CancellationToken cancellationToken = default)
    {
        using var stream = OpenReadStream();
        return stream.CopyToAsync(target, cancellationToken);
    }
}
