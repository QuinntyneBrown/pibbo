using Microsoft.EntityFrameworkCore;
using Pibbo.Domain.Content;

namespace Pibbo.Infrastructure.Persistence;

/// <summary>The content database. It has tables for content and for nothing else.</summary>
public sealed class ContentDbContext(DbContextOptions<ContentDbContext> options) : DbContext(options)
{
    private const int MaxIdLength = 64;
    private const int MaxPathLength = Domain.Assets.AssetPath.MaxLength;

    public DbSet<ContentVersionRow> Versions => Set<ContentVersionRow>();

    public DbSet<ActivityRow> Activities => Set<ActivityRow>();

    public DbSet<LessonRow> Lessons => Set<LessonRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ContentVersionRow>(version =>
        {
            version.ToTable("content_versions");
            version.Property(row => row.Version).HasMaxLength(ContentText.MaxLength);
            version.Property(row => row.ETag).HasMaxLength(MaxIdLength);
            version.Property(row => row.PublishedBy).HasMaxLength(MaxIdLength * 2);
            version.HasIndex(row => row.Version).IsUnique();
            version.HasMany(row => row.Activities).WithOne().HasForeignKey(row => row.ContentVersionId);
            version.HasMany(row => row.Lessons).WithOne().HasForeignKey(row => row.ContentVersionId);
        });

        modelBuilder.Entity<ActivityRow>(activity =>
        {
            activity.ToTable("activities");
            activity.Property(row => row.ActivityId).HasMaxLength(MaxIdLength);
            activity.Property(row => row.Group).HasMaxLength(MaxIdLength);
            activity.Property(row => row.Name).HasMaxLength(ContentText.MaxLength);
            activity.Property(row => row.Glyph).HasMaxLength(ContentText.MaxLength);
            activity.Property(row => row.Recording).HasMaxLength(MaxPathLength);
            activity.HasIndex(row => new { row.ContentVersionId, row.ActivityId }).IsUnique();
        });

        modelBuilder.Entity<LessonRow>(lesson =>
        {
            lesson.ToTable("lessons");
            lesson.Property(row => row.LessonId).HasMaxLength(MaxIdLength);
            lesson.Property(row => row.Name).HasMaxLength(ContentText.MaxLength);
            lesson.Property(row => row.Recording).HasMaxLength(MaxPathLength);
            lesson.HasIndex(row => new { row.ContentVersionId, row.LessonId }).IsUnique();
        });
    }
}
