FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY BlueEmber.Api.csproj ./
RUN dotnet restore BlueEmber.Api.csproj

COPY . ./
RUN dotnet publish BlueEmber.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish ./

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080

CMD ["sh", "-c", "dotnet BlueEmber.Api.dll --urls http://0.0.0.0:${PORT:-8080}"]
