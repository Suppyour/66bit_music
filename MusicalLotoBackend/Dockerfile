# Устанавливаем базовый образ для сборки (SDK умеет компилировать C#)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Копируем файлы решений и проектов (это позволяет Docker кэшировать скачивание NuGet пакетов)
COPY ["MusicalLotoBackend.sln", "./"]
COPY ["MusicalLotoBackend.Core/MusicalLotoBackend.Core.csproj", "MusicalLotoBackend.Core/"]
COPY ["MusicalLotoBackend.Database/MusicalLotoBackend.Database.csproj", "MusicalLotoBackend.Database/"]
COPY ["MusicalLotoBackend.Domain/MusicalLotoBackend.Domain.csproj", "MusicalLotoBackend.Domain/"]

# Восстанавливаем зависимости
RUN dotnet restore "MusicalLotoBackend.sln"

# Теперь копируем ВЕСЬ остальной код проекта
COPY . .

# Собираем и публикуем всё ядро в папку /app/publish
WORKDIR "/src/MusicalLotoBackend.Core"
RUN dotnet publish "MusicalLotoBackend.Core.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Финальный образ (только ASP.NET Core Runtime, без тяжелого SDK, чтобы контейнер весил мало)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080

# Переносим скомпилированные файлы из слоя `build` в слой `final`
COPY --from=build /app/publish .

# Если папки wwwroot нет, docker её создаст, но мы хотим чтобы права доступа были корректными
RUN mkdir -p /app/wwwroot && chmod 777 /app/wwwroot

# Запускаем приложение
ENTRYPOINT ["dotnet", "MusicalLotoBackend.Core.dll"]
