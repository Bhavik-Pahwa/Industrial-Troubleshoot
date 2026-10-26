$ErrorActionPreference = 'Stop'
$statePath = Join-Path (Split-Path $PSScriptRoot -Parent) '.runtime/processes.json'
if (-not (Test-Path $statePath)) { Write-Host 'No managed stack is running.'; return }
foreach ($item in (Get-Content $statePath -Raw | ConvertFrom-Json)) {
    $process = Get-Process -Id $item.id -ErrorAction SilentlyContinue
    if ($process -and $process.StartTime.ToUniversalTime().ToString('o') -eq $item.started) {
        Stop-Process -Id $item.id
        Write-Host "Stopped $($item.name)"
    }
}
Remove-Item -LiteralPath $statePath
