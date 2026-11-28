using System.Text;
using System.Xml;
using System.Xml.Linq;

namespace Pibbo.Domain.Assets;

/// <summary>
/// Makes an SVG safe to serve: it keeps the drawing and drops everything that runs, loads or
/// leads somewhere else. A file that is not a well-formed SVG, or declares a DTD, is refused.
/// </summary>
public static class SvgSanitiser
{
    private static readonly XNamespace SvgNamespace = "http://www.w3.org/2000/svg";
    private static readonly XNamespace XlinkNamespace = "http://www.w3.org/1999/xlink";

    private static readonly HashSet<string> RemovedElements = new(StringComparer.OrdinalIgnoreCase)
    {
        "script", "style", "foreignObject", "set", "animate", "animateMotion", "animateTransform", "discard",
        "iframe", "embed", "object", "handler", "listener",
    };

    /// <summary>The sanitised SVG, or null when the bytes are not a well-formed SVG.</summary>
    public static byte[]? Sanitise(byte[] bytes)
    {
        XDocument document;
        try
        {
            using var stream = new MemoryStream(bytes);
            using var reader = XmlReader.Create(stream, new XmlReaderSettings
            {
                DtdProcessing = DtdProcessing.Prohibit,
                XmlResolver = null,
                MaxCharactersInDocument = MediaType.MaxUploadBytes * 2L,
                IgnoreProcessingInstructions = true,
                IgnoreComments = true,
            });
            document = XDocument.Load(reader);
        }
        catch (XmlException)
        {
            return null;
        }

        if (document.Root is not { } root || root.Name != SvgNamespace + "svg")
        {
            return null;
        }

        foreach (var element in root.DescendantsAndSelf().ToArray())
        {
            if (element != root && (element.Name.Namespace != SvgNamespace || RemovedElements.Contains(element.Name.LocalName)))
            {
                element.Remove();
            }
        }

        foreach (var element in root.DescendantsAndSelf())
        {
            foreach (var attribute in element.Attributes().ToArray())
            {
                if (!IsSafe(attribute))
                {
                    attribute.Remove();
                }
            }
        }

        var declaration = new XDocument(root);
        return Encoding.UTF8.GetBytes(declaration.ToString(SaveOptions.DisableFormatting));
    }

    private static bool IsSafe(XAttribute attribute)
    {
        if (attribute.IsNamespaceDeclaration)
        {
            return true;
        }

        var name = attribute.Name.LocalName;
        var value = attribute.Value.Trim();
        if (name.StartsWith("on", StringComparison.OrdinalIgnoreCase) || attribute.Name.Namespace == XNamespace.Xml)
        {
            return false;
        }

        // A link or reference may point only inside the drawing.
        if (name == "href" || attribute.Name.Namespace == XlinkNamespace)
        {
            return value.StartsWith('#');
        }

        var lowered = value.ToLowerInvariant();
        if (lowered.Contains("javascript:") || lowered.Contains("data:") || lowered.Contains("@import"))
        {
            return false;
        }

        return !ReferencesOutside(lowered);
    }

    private static bool ReferencesOutside(string value)
    {
        for (var at = value.IndexOf("url(", StringComparison.Ordinal); at >= 0; at = value.IndexOf("url(", at + 4, StringComparison.Ordinal))
        {
            var target = value[(at + 4)..].TrimStart(' ', '\'', '"');
            if (!target.StartsWith('#'))
            {
                return true;
            }
        }

        return false;
    }
}
