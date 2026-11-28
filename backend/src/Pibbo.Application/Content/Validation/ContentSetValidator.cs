using FluentValidation;
using Pibbo.Application.Assets;
using Pibbo.Domain.Assets;
using Pibbo.Domain.Content;

namespace Pibbo.Application.Content.Validation;

/// <summary>
/// The check every content version passes before it is served, whether it came from the
/// reviewed file or from an editor: ids well formed and unique, text from the allow-list and
/// at most 80 characters, every picture and recording a well-formed path to a file that
/// exists, and lessons naming only activities that exist.
/// </summary>
public sealed class ContentSetValidator : AbstractValidator<ContentSet>
{
    public ContentSetValidator(IAssetStore assets)
    {
        RuleFor(content => content.Version).ContentText().OverridePropertyName("version");

        RuleFor(content => content.Activities)
            .Must(activities => activities.Select(activity => activity.Id).Distinct(StringComparer.Ordinal).Count() == activities.Count)
            .OverridePropertyName("activities")
            .WithMessage("Each activity id appears once.");
        RuleForEach(content => content.Activities)
            .SetValidator(new ActivityValidator(assets))
            .OverridePropertyName("activities");

        RuleFor(content => content.Lessons)
            .Must(lessons => lessons.Select(lesson => lesson.Id).Distinct(StringComparer.Ordinal).Count() == lessons.Count)
            .OverridePropertyName("lessons")
            .WithMessage("Each lesson id appears once.");
        RuleForEach(content => content.Lessons)
            .SetValidator((content, _) => new LessonValidator(content.Activities.Select(activity => activity.Id).ToHashSet(), assets))
            .OverridePropertyName("lessons");
    }

    private sealed class ActivityValidator : AbstractValidator<Activity>
    {
        public ActivityValidator(IAssetStore assets)
        {
            RuleFor(activity => activity.Id).ContentId().OverridePropertyName("id");
            RuleFor(activity => activity.Group).ContentId().OverridePropertyName("group");
            RuleFor(activity => activity.Name).ContentText().OverridePropertyName("name");
            RuleFor(activity => activity.Glyph).ContentText().OverridePropertyName("glyph");
            RuleFor(activity => activity.Recording).Asset(assets, AssetPath.IsRecording).OverridePropertyName("recording");
            RuleForEach(activity => activity.Pictures).Asset(assets, AssetPath.IsPicture).OverridePropertyName("pictures");
            RuleForEach(activity => activity.Recordings).Asset(assets, AssetPath.IsRecording).OverridePropertyName("recordings");
        }
    }

    private sealed class LessonValidator : AbstractValidator<Lesson>
    {
        public LessonValidator(IReadOnlySet<string> activityIds, IAssetStore assets)
        {
            RuleFor(lesson => lesson.Id).ContentId().OverridePropertyName("id");
            RuleFor(lesson => lesson.Name).ContentText().OverridePropertyName("name");
            RuleFor(lesson => lesson.Recording).Asset(assets, AssetPath.IsRecording).OverridePropertyName("recording");
            RuleFor(lesson => lesson.Activities).NotEmpty().OverridePropertyName("activities").WithMessage("A lesson has at least one activity.");
            RuleForEach(lesson => lesson.Activities)
                .Must(activityIds.Contains)
                .OverridePropertyName("activities")
                .WithMessage("A lesson names only activities in the same version.");
        }
    }
}
