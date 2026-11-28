using System.Text;

namespace Pibbo.Api.AcceptanceTests.Support;

/// <summary>The first bytes of each kind of file, padded to a size.</summary>
public static class SampleFiles
{
    public const int OneMegabyte = 1024 * 1024;

    public static byte[] Mp3(int size = 64) => Pad([.. "ID3"u8, 4, 0, 0, 0, 0, 0, 0], size);

    public static byte[] Mp3WithoutTag(int size = 64) => Pad([0xFF, 0xFB, 0x90, 0x64], size);

    public static byte[] Ogg(int size = 64) => Pad([.. "OggS"u8, 0, 2], size);

    public static byte[] Webp(int size = 64) => Pad([.. "RIFF"u8, 0, 0, 0, 0, .. "WEBPVP8 "u8], size);

    public static byte[] Wav(int size = 64) => Pad([.. "RIFF"u8, 0, 0, 0, 0, .. "WAVEfmt "u8], size);

    public static byte[] Png(int size = 64) => Pad([0x89, .. "PNG"u8, 0x0D, 0x0A, 0x1A, 0x0A], size);

    public static byte[] Jpeg(int size = 64) => Pad([0xFF, 0xD8, 0xFF, 0xE0], size);

    public static byte[] Svg(string inner = "<circle cx=\"5\" cy=\"5\" r=\"4\" />") =>
        Encoding.UTF8.GetBytes($"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 10 10\">{inner}</svg>");

    public static byte[] SvgOfSize(int size)
    {
        var svg = Svg();
        var padding = new string(' ', Math.Max(0, size - svg.Length));
        return Encoding.UTF8.GetBytes(Encoding.UTF8.GetString(svg).Replace("<circle", padding + "<circle"));
    }

    private static byte[] Pad(byte[] head, int size)
    {
        var bytes = new byte[Math.Max(size, head.Length)];
        head.CopyTo(bytes, 0);
        return bytes;
    }
}
