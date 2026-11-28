using System.Text;

namespace Pibbo.Domain.Assets;

/// <summary>A kind of file that may be uploaded: where it goes, its extension and its size cap.</summary>
public sealed record MediaType(string ContentType, string Extension, string Folder, int MaxBytes)
{
    public const int Megabyte = 1024 * 1024;

    public static readonly MediaType Mpeg = new("audio/mpeg", "mp3", AssetPath.Recordings, Megabyte);
    public static readonly MediaType Ogg = new("audio/ogg", "ogg", AssetPath.Recordings, Megabyte);
    public static readonly MediaType Webp = new("image/webp", "webp", AssetPath.Pictures, 2 * Megabyte);
    public static readonly MediaType Svg = new("image/svg+xml", "svg", AssetPath.Pictures, 2 * Megabyte);

    /// <summary>The largest file any kind allows. Nothing past it is read.</summary>
    public const int MaxUploadBytes = 2 * Megabyte;

    public static IReadOnlyList<MediaType> All { get; } = [Mpeg, Ogg, Webp, Svg];

    public bool FitsPath(string path) =>
        path.StartsWith($"/{Folder}/", StringComparison.Ordinal) && AssetPath.ExtensionOf(path) == Extension;

    /// <summary>What the bytes are, by their first bytes alone. The declared type is never asked.</summary>
    public static MediaType? Sniff(ReadOnlySpan<byte> bytes)
    {
        if (bytes.StartsWith("ID3"u8) || (bytes.Length >= 2 && bytes[0] == 0xFF && (bytes[1] & 0xE0) == 0xE0 && (bytes[1] & 0x06) != 0))
        {
            return Mpeg;
        }

        if (bytes.StartsWith("OggS"u8))
        {
            return Ogg;
        }

        if (bytes.Length >= 12 && bytes.StartsWith("RIFF"u8) && bytes[8..12].SequenceEqual("WEBP"u8))
        {
            return Webp;
        }

        return LooksLikeSvg(bytes) ? Svg : null;
    }

    private static bool LooksLikeSvg(ReadOnlySpan<byte> bytes)
    {
        var head = bytes[..Math.Min(bytes.Length, 1024)];
        if (head.StartsWith((ReadOnlySpan<byte>)[0xEF, 0xBB, 0xBF]))
        {
            head = head[3..];
        }

        var text = Encoding.UTF8.GetString(head).TrimStart();
        return text.StartsWith("<svg", StringComparison.Ordinal)
            || text.StartsWith("<?xml", StringComparison.Ordinal)
            || text.StartsWith("<!--", StringComparison.Ordinal)
            || text.StartsWith("<!DOCTYPE svg", StringComparison.OrdinalIgnoreCase);
    }
}
