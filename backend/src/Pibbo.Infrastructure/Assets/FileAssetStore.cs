using Pibbo.Application.Assets;
using Pibbo.Infrastructure.Content;

namespace Pibbo.Infrastructure.Assets;

/// <summary>Pictures and recordings as files under the assets directory, where they are served from.</summary>
public sealed class FileAssetStore(ContentStoreOptions options) : IAssetStore
{
    public Task<bool> ExistsAsync(string path, CancellationToken cancellationToken) =>
        Task.FromResult(File.Exists(Resolve(path)));

    public async Task<bool> SaveAsync(string path, ReadOnlyMemory<byte> content, CancellationToken cancellationToken)
    {
        var target = Resolve(path);
        var existed = File.Exists(target);
        Directory.CreateDirectory(Path.GetDirectoryName(target)!);

        // Written beside the target and moved into place, so a reader never sees half a file.
        var partial = $"{target}.{Guid.NewGuid():N}.partial";
        try
        {
            await File.WriteAllBytesAsync(partial, content, cancellationToken);
            File.Move(partial, target, overwrite: true);
        }
        finally
        {
            File.Delete(partial);
        }

        return !existed;
    }

    /// <summary>The file's place on disk. A path that would leave the assets directory is refused.</summary>
    private string Resolve(string path)
    {
        var root = Path.GetFullPath(options.AssetsDirectory);
        var resolved = Path.GetFullPath(Path.Combine(root, path.TrimStart('/')));
        if (!resolved.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.Ordinal))
        {
            throw new ArgumentException("The path leaves the assets directory.", nameof(path));
        }

        return resolved;
    }
}
