using Microsoft.AspNetCore.Http;
using System.Threading;
using System.Threading.Tasks;

namespace MusicalLotoBackend.Core.Services;

public interface IFileStorageService
{
    Task<string> UploadFileAsync(IFormFile file, string folderName, CancellationToken cancellationToken = default);
    Task DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default);
}
