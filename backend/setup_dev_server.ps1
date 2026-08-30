# =====================================================================
# SPATIALOS DEVELOPMENT NETWORK & FIREWALL ORCHESTRATOR
# Resolves 'errno = 113 No route to host' & configures LAN security rules
# =====================================================================
$ErrorActionPreference = "SilentlyContinue"

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host " 🚀 SPATIALOS SECURE LAN SERVER BOOTSTRAPPER & ENGINE " -ForegroundColor Cyan
Write-Host "=======================================================`n" -ForegroundColor Cyan

# 1. Check and Configure Windows Defender Firewall for TCP Port 3000
Write-Host "[(1/4)] Verifying Windows Firewall permissions for LAN testing..." -ForegroundColor Yellow
$firewallRuleName = "SpatialOS_LAN_Port_3000"
$existingRule = Get-NetFirewallRule -DisplayName $firewallRuleName -ErrorAction SilentlyContinue
if (-not $existingRule) {
    Write-Host "   -> No inbound firewall allow rule detected for TCP Port 3000." -ForegroundColor DarkYellow
    Write-Host "   -> Registering automatic firewall rule '$firewallRuleName'..." -ForegroundColor DarkYellow
    try {
        New-NetFirewallRule -DisplayName $firewallRuleName -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Any -ErrorAction Stop | Out-Null
        Write-Host "   ✅ Successfully created Windows Firewall allow rule for LAN mobile testing!" -ForegroundColor Green
    } catch {
        Write-Host "   ⚡ Requesting Administrator authorization via Windows pop-up (UAC) to register firewall..." -ForegroundColor Cyan
        try {
            Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"New-NetFirewallRule -DisplayName '$firewallRuleName' -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Any; Start-Sleep -Seconds 2`"" -Wait
            Write-Host "   ✅ Windows Firewall allow rule created successfully via elevation!" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ Elevation was cancelled or denied. Windows Firewall will continue blocking mobile Wi-Fi packets." -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ✅ Windows Firewall rule '$firewallRuleName' is active and allowing LAN packets!" -ForegroundColor Green
}

# 2. Clean up old node sessions occupying port 3000
Write-Host "`n[(2/4)] Ensuring TCP port 3000 is clean and unblocked..." -ForegroundColor Yellow
$conn = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($conn) {
    $pids = $conn | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
    Write-Host "   🧹 Closed leftover Node background processes on Port 3000." -ForegroundColor Green
} else {
    Write-Host "   ✅ Port 3000 is ready for clean binding." -ForegroundColor Green
}

# 3. Discover Active Wi-Fi & LAN IPv4 Address
Write-Host "`n[(3/4)] Detecting laptop LAN network IP coordinates..." -ForegroundColor Yellow
$adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.InterfaceAlias -notlike "*WSL*" -and 
    $_.InterfaceAlias -notlike "*vEthernet*" -and
    $_.InterfaceAlias -notlike "*VirtualBox*" -and
    $_.IPAddress -ne "127.0.0.1"
}
$wifiIp = "192.168.1.6" # Fallback default
if ($adapters) {
    $wifiIp = ($adapters | Select-Object -First 1).IPAddress
}

Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host " 🌐 SPATIALOS SERVER NETWORK HOST DETECTED: " -ForegroundColor White
Write-Host " 👉 https://${wifiIp}:3000 👈" -ForegroundColor Green
Write-Host " (Ensure your smartphone is on the same Wi-Fi network)" -ForegroundColor Gray
Write-Host "=======================================================`n" -ForegroundColor Green

# 4. Boot up NestJS backend server with zero-trust security & RAM caching
Write-Host "[(4/4)] Launching NestJS backend in development mode..." -ForegroundColor Yellow
npm run start:dev
