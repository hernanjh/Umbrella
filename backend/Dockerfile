FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/ERP.API/ERP.API.csproj", "src/ERP.API/"]
COPY ["src/ERP.Application/ERP.Application.csproj", "src/ERP.Application/"]
COPY ["src/ERP.Domain/ERP.Domain.csproj", "src/ERP.Domain/"]
COPY ["src/ERP.Infrastructure/ERP.Infrastructure.csproj", "src/ERP.Infrastructure/"]
RUN dotnet restore "src/ERP.API/ERP.API.csproj"
COPY . .
RUN dotnet build "src/ERP.API/ERP.API.csproj" -c Release -o /app/build
RUN dotnet publish "src/ERP.API/ERP.API.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "ERP.API.dll"]
