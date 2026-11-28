using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Pibbo.Application.Behaviors;

namespace Pibbo.Application;

public static class ApplicationServices
{
    /// <summary>The queries, their validators and the pipeline that runs one before the other.</summary>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(ApplicationServices).Assembly;
        services.AddValidatorsFromAssembly(assembly);
        services.AddMediatR(mediatr =>
        {
            mediatr.RegisterServicesFromAssembly(assembly);
            mediatr.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });
        return services;
    }
}
