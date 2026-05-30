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

# Install Google Chrome stable (non-snap) and basic TTF fonts for Puppeteer rendering
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-keyring.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update && apt-get install -y \
    google-chrome-stable \
    fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

RUN mkdir -p /app/wwwroot && chmod 777 /app/wwwroot

ENTRYPOINT ["dotnet", "MusicalLotoBackend.Core.dll"]
