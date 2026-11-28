using Pibbo.Domain.Content;

namespace Pibbo.Application.Content;

/// <summary>Where the content is kept. It holds content only: nothing about a child or a device.</summary>
public interface IContentStore
{
    /// <summary>The content version now served, or null while the store cannot be reached
    /// or its content does not pass the check.</summary>
    ContentSnapshot? Read();
}
