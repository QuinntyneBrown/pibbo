namespace Pibbo.Application.Assets;

/// <summary>Where pictures and recordings are kept. Paths are checked with <c>AssetPath</c> first.</summary>
public interface IAssetStore
{
    Task<bool> ExistsAsync(string path, CancellationToken cancellationToken);

    /// <summary>Stores the file, replacing any already there. True when it was not there before.</summary>
    Task<bool> SaveAsync(string path, ReadOnlyMemory<byte> content, CancellationToken cancellationToken);
}
