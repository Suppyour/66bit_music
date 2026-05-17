using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Minio;
using Minio.DataModel.Args;
using Minio.Exceptions;

namespace MusicalLotoBackend.Core.Services;

public class MinioFileStorageService : IFileStorageService
{
    private readonly IMinioClient _minioClient;
    private readonly string _bucketName;
    private readonly string _endpoint;
    private readonly string _publicEndpoint;

    public MinioFileStorageService(IMinioClient minioClient, IConfiguration configuration)
    {
        _minioClient = minioClient;
        _bucketName = configuration["Minio:BucketName"] ?? "music-loto";
        _endpoint = configuration["Minio:Endpoint"] ?? "localhost:9000";
        _publicEndpoint = configuration["Minio:PublicEndpoint"] ?? _endpoint;
    }

    public async Task<string> UploadFileAsync(IFormFile file, string folderName, CancellationToken cancellationToken = default)
    {
        try
        {
            var extension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var objectName = $"{folderName}/{uniqueFileName}";

            using var stream = file.OpenReadStream();
            
            var putObjectArgs = new PutObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(objectName)
                .WithStreamData(stream)
                .WithObjectSize(file.Length)
                .WithContentType(file.ContentType);

            await _minioClient.PutObjectAsync(putObjectArgs, cancellationToken);

            var schema = _publicEndpoint.Contains("localhost") ? "http" : "https";
            return $"{schema}://{_publicEndpoint}/{_bucketName}/{objectName}";
        }
        catch (MinioException e)
        {
            Console.WriteLine($"[Bucket] Exception: {e}");
            throw;
        }
    }

    public async Task DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrEmpty(fileUrl)) return;
            
            var uri = new Uri(fileUrl);
            var path = uri.PathAndQuery.TrimStart('/');
            var objectName = path.Substring(path.IndexOf('/') + 1);

            var removeObjectArgs = new RemoveObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(objectName);

            await _minioClient.RemoveObjectAsync(removeObjectArgs, cancellationToken);
        }
        catch (Exception e)
        {
            Console.WriteLine($"[Bucket] Delete Exception: {e}");
        }
    }
}
