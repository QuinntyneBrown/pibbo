using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Pibbo.Infrastructure.Persistence;

/// <summary>Lets <c>dotnet ef</c> build the context when a migration is added.</summary>
public sealed class ContentDbContextFactory : IDesignTimeDbContextFactory<ContentDbContext>
{
    public ContentDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<ContentDbContext>().UseSqlite("Data Source=design-time.db").Options);
}
