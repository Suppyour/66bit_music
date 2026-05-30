FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["MusicalLotoBackend.sln", "./"]
COPY ["MusicalLotoBackend.Core/MusicalLotoBackend.Core.csproj", "MusicalLotoBackend.Core/"]
COPY ["MusicalLotoBackend.Database/MusicalLotoBackend.Database.csproj", "MusicalLotoBackend.Database/"]
COPY ["MusicalLotoBackend.Domain/MusicalLotoBackend.Domain.csproj", "MusicalLotoBackend.Domain/"]

RUN dotnet restore "MusicalLotoBackend.sln"

COPY . .

WORKDIR "/src/MusicalLotoBackend.Core"
RUN dotnet publish "MusicalLotoBackend.Core.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080

COPY --from=build /app/publish .

RUN mkdir -p /app/wwwroot && chmod 777 /app/wwwroot

# Install Chromium and basic TTF fonts for Puppeteer rendering
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["dotnet", "MusicalLotoBackend.Core.dll"]
