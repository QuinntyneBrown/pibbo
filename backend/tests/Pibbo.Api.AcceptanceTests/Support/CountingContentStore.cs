using Pibbo.Application.Content;
using Pibbo.Domain.Content;

namespace Pibbo.Api.AcceptanceTests.Support;

/// <summary>Counts lookups, so a test can show that none was made.</summary>
public sealed class CountingContentStore(IContentStore inner) : IContentStore
{
    private int _lookups;

    public int Lookups => _lookups;

    public ContentSnapshot? Read()
    {
        Interlocked.Increment(ref _lookups);
        return inner.Read();
    }
}
