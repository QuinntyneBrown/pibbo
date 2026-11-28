# The content service. Build from backend/:  docker build -t pibbo-api .
# Both base images are pinned by digest (L2-039 #2); update the tag and the digest together.

# mcr.microsoft.com/dotnet/sdk:10.0
FROM mcr.microsoft.com/dotnet/sdk@sha256:8c6edfb26c85153f236d26efebd9ad349aec403583f343f201ee67838b23658d AS build
WORKDIR /source
COPY Directory.Build.props ./
COPY src/ src/
RUN dotnet publish src/Pibbo.Api/Pibbo.Api.csproj -c Release -o /app /p:UseAppHost=false \
    && mkdir /data

# mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled: no shell, no package manager, non-root.
FROM mcr.microsoft.com/dotnet/aspnet@sha256:bcdfe6b8e923ad3d05f01dfa805ab97c99d742823ce030856002a6db38122712
WORKDIR /app
COPY --from=build /app ./
# The reviewed content is mounted read-only at /app/content (content.json and assets/).
# The SQLite database lives in /data: mount a volume there to keep it between runs.
COPY --from=build --chown=$APP_UID:$APP_UID /data /data
ENV ASPNETCORE_HTTP_PORTS=8080 \
    ConnectionStrings__Content="Data Source=/data/pibbo-content.db" \
    DOTNET_CLI_TELEMETRY_OPTOUT=1
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "Pibbo.Api.dll"]
