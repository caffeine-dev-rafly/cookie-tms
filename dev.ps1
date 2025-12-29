param(
    [switch]$SkipFrontendInstall,
    [switch]$Stop
)

$ErrorActionPreference = 'Stop'

function Assert-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Error "Required command '$Name' is not available on PATH."
        exit 1
    }
}

Write-Host "Checking prerequisites..." -ForegroundColor Cyan
Assert-Command docker
Assert-Command npm

if ($Stop) {
    Write-Host "`nStopping backend stack via docker compose..." -ForegroundColor Cyan
    docker compose down

    Write-Host "`nIf the frontend dev server is running, close its PowerShell window to stop it." -ForegroundColor Yellow
    return
}

# Start backend stack (Django + Postgres + Redis + Traccar) in Docker
Write-Host "`nStarting backend stack via docker compose..." -ForegroundColor Cyan
docker compose up -d

Write-Host "`nApplying backend migrations..." -ForegroundColor Cyan
docker compose exec -T web python manage.py migrate
docker compose exec -T master-api python manage.py migrate

# Frontend deps (once)
if (-not $SkipFrontendInstall) {
    if (-not (Test-Path "tms_frontend/node_modules")) {
        Write-Host "`nInstalling frontend dependencies..." -ForegroundColor Cyan
        Push-Location tms_frontend
        npm install
        Pop-Location
    }
}

# Start Vite dev server in a new PowerShell window
Write-Host "`nStarting frontend dev server (Vite)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd tms_frontend; npm run dev -- --host'

Write-Host "`nAll services requested. Useful commands:" -ForegroundColor Green
Write-Host "  - Backend logs: cd tms_core; docker compose logs -f web"
Write-Host "  - Stop stack:  cd tms_core; docker compose down"
