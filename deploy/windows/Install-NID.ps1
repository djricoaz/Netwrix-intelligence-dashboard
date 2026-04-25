#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Netwrix Intelligence Dashboard — Windows Server Installer
.DESCRIPTION
    Installs NID as a Windows Service using NSSM + Docker Desktop (WSL2 backend).
    Supports Windows Server 2019 / 2022.
#>

param(
    [string]$InstallDir = "C:\NID",
    [switch]$SkipDockerCheck
)

$ErrorActionPreference = "Stop"

function Write-Banner {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  Netwrix Intelligence Dashboard — Windows Installer  ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step([string]$msg) { Write-Host "[NID] $msg" -ForegroundColor Cyan }
function Write-OK([string]$msg)   { Write-Host "[OK]  $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[!]   $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "[ERR] $msg" -ForegroundColor Red; exit 1 }

Write-Banner

# ── Prerequisites ──────────────────────────────────────────────────────────────
Write-Step "Checking prerequisites..."

if (-not $SkipDockerCheck) {
    try {
        docker version | Out-Null
        Write-OK "Docker Desktop found"
    } catch {
        Write-Fail "Docker Desktop not found. Install from https://www.docker.com/products/docker-desktop/ then re-run."
    }
}

# Check WSL2
$wsl = wsl --status 2>&1
if ($wsl -notmatch "WSL 2") {
    Write-Warn "WSL2 not detected. Enabling..."
    wsl --install --no-distribution
    Write-Warn "Reboot required for WSL2. Re-run installer after reboot."
    exit 0
}
Write-OK "WSL2 ready"

# ── Install directory ─────────────────────────────────────────────────────────
Write-Step "Installing to $InstallDir"
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
New-Item -ItemType Directory -Force -Path "$InstallDir\tools" | Out-Null
New-Item -ItemType Directory -Force -Path "$InstallDir\ssl"   | Out-Null
New-Item -ItemType Directory -Force -Path "$InstallDir\logs"  | Out-Null
Copy-Item -Recurse -Force "$PSScriptRoot\..\.." "$InstallDir\"
Set-Location $InstallDir

# ── Configuration wizard ──────────────────────────────────────────────────────
Write-Step "Starting configuration wizard..."

if (-not (Test-Path "$InstallDir\.env")) {
    Copy-Item "$InstallDir\.env.example" "$InstallDir\.env"

    $naUrl    = Read-Host "  Netwrix Auditor URL (e.g. https://na-server:9699/netwrix/api/v1)"
    $naUser   = Read-Host "  Netwrix Auditor username (DOMAIN\user)"
    $naPass   = Read-Host "  Netwrix Auditor password" -AsSecureString
    $ndcUrl   = Read-Host "  NDC URL (e.g. http://ndc-server)"
    $ndcUser  = Read-Host "  NDC username (DOMAIN\user)"
    $ndcPass  = Read-Host "  NDC password" -AsSecureString

    $naPassPlain  = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($naPass))
    $ndcPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($ndcPass))
    $influxToken  = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    $secretKey    = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))

    $env = Get-Content "$InstallDir\.env"
    $env = $env -replace "NA_BASE_URL=.*",    "NA_BASE_URL=$naUrl"
    $env = $env -replace "NA_USERNAME=.*",    "NA_USERNAME=$naUser"
    $env = $env -replace "NA_PASSWORD=.*",    "NA_PASSWORD=$naPassPlain"
    $env = $env -replace "NDC_BASE_URL=.*",   "NDC_BASE_URL=$ndcUrl"
    $env = $env -replace "NDC_USERNAME=.*",   "NDC_USERNAME=$ndcUser"
    $env = $env -replace "NDC_PASSWORD=.*",   "NDC_PASSWORD=$ndcPassPlain"
    $env = $env -replace "INFLUXDB_TOKEN=.*", "INFLUXDB_TOKEN=$influxToken"
    $env = $env -replace "SECRET_KEY_BASE=.*","SECRET_KEY_BASE=$secretKey"
    $env | Set-Content "$InstallDir\.env"
    Write-OK "Configuration saved"
}

# ── Build and start containers ────────────────────────────────────────────────
Write-Step "Building and starting containers (first run may take 10-15 min)..."
docker compose -f "$InstallDir\deploy\linux\docker-compose.prod.yml" --project-directory $InstallDir build
docker compose -f "$InstallDir\deploy\linux\docker-compose.prod.yml" --project-directory $InstallDir up -d
Write-OK "Containers started"

# ── Pull AI model ─────────────────────────────────────────────────────────────
Write-Step "Loading AI model (llama3.2 ~2GB)..."
docker exec nid_ollama ollama pull llama3.2

# ── Register as Windows Service using sc.exe ──────────────────────────────────
Write-Step "Registering Windows Service..."
$svcName = "NetwrixIntelligenceDashboard"
$dockerCmd = "docker compose -f `"$InstallDir\deploy\linux\docker-compose.prod.yml`" --project-directory `"$InstallDir`" up"

sc.exe create $svcName binpath= "cmd /c $dockerCmd" start= auto DisplayName= "Netwrix Intelligence Dashboard" | Out-Null
sc.exe description $svcName "Netwrix Intelligence Dashboard — Security analytics and AI prediction platform" | Out-Null
sc.exe start $svcName | Out-Null
Write-OK "Windows Service '$svcName' registered and started"

# ── Firewall rules ────────────────────────────────────────────────────────────
Write-Step "Adding firewall rules..."
New-NetFirewallRule -DisplayName "NID HTTPS"       -Direction Inbound -Protocol TCP -LocalPort 443  -Action Allow -ErrorAction SilentlyContinue | Out-Null
New-NetFirewallRule -DisplayName "NID HTTP"        -Direction Inbound -Protocol TCP -LocalPort 80   -Action Allow -ErrorAction SilentlyContinue | Out-Null
New-NetFirewallRule -DisplayName "NID CEF Listener"-Direction Inbound -Protocol TCP -LocalPort 5514 -Action Allow -ErrorAction SilentlyContinue | Out-Null
Write-OK "Firewall rules added"

# ── Done ──────────────────────────────────────────────────────────────────────
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback" } | Select-Object -First 1).IPAddress
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  Installation complete!                              ║" -ForegroundColor Green
Write-Host "╠══════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  Dashboard:  https://$ip"                              -ForegroundColor Green
Write-Host "║  CEF Port:   TCP 5514                               ║" -ForegroundColor Green
Write-Host "║  Service:    $svcName                               ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
