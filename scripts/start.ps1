param([string]$Model = 'qwen2.5:3b')
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$runtime = Join-Path $repo '.runtime'
New-Item -ItemType Directory -Force -Path $runtime | Out-Null
$statePath = Join-Path $runtime 'processes.json'
if (Test-Path $statePath) {
    throw 'A managed stack already exists. Run scripts/stop.ps1 before restarting.'
}
foreach ($port in @(5173, 8000, 8001)) {
    if (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) {
        throw "Port $port is occupied. Stop its service before starting this stack."
    }
}
foreach ($path in @('backend/.venv/Scripts/python.exe', 'AI/.venv/Scripts/python.exe', 'FRONTEND/node_modules/vite/bin/vite.js')) {
    if (-not (Test-Path (Join-Path $repo $path))) { throw 'Run scripts/setup.ps1 first.' }
}
$savedEnv = @{}
foreach ($name in @('OLLAMA_MODEL', 'INDUX_DETECTOR', 'INDUX_AI_URL', 'VITE_API_BASE_URL')) {
    $savedEnv[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}
$processes = @()
function Start-ServiceProcess($Name, $Executable, $Arguments, $Directory = $repo) {
    $process = Start-Process -FilePath $Executable -ArgumentList $Arguments -WorkingDirectory $Directory -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime "$Name.out.log") -RedirectStandardError (Join-Path $runtime "$Name.err.log")
    return @{ name = $Name; id = $process.Id; started = $process.StartTime.ToUniversalTime().ToString('o') }
}
function Wait-Healthy($Url) {
    $deadline = (Get-Date).AddSeconds(60)
    do {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 3
            if ($response.StatusCode -eq 200) { return }
        } catch { }
        Start-Sleep -Milliseconds 500
    } while ((Get-Date) -lt $deadline)
    throw "Service did not become ready: $Url. Check .runtime logs."
}
try {
    $env:OLLAMA_MODEL = $Model
    $env:INDUX_DETECTOR = 'ai'
    $env:INDUX_AI_URL = 'http://127.0.0.1:8001'
    $env:VITE_API_BASE_URL = 'http://127.0.0.1:8000/api/v1'
    $processes += Start-ServiceProcess 'ai' (Join-Path $repo 'AI/.venv/Scripts/python.exe') '-m uvicorn AI.app.main:app --host 127.0.0.1 --port 8001'
    Wait-Healthy 'http://127.0.0.1:8001/ai/health'
    $processes += Start-ServiceProcess 'backend' (Join-Path $repo 'backend/.venv/Scripts/python.exe') '-m indux'
    Wait-Healthy 'http://127.0.0.1:8000/api/v1/health'
    $processes += Start-ServiceProcess 'frontend' (Get-Command node).Source 'node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort' (Join-Path $repo 'FRONTEND')
    Wait-Healthy 'http://127.0.0.1:5173'
    $processes | ConvertTo-Json | Set-Content $statePath
    Write-Host 'Frontend: http://127.0.0.1:5173/dashboard'
    Write-Host 'Backend:  http://127.0.0.1:8000/docs'
    Write-Host 'AI:       http://127.0.0.1:8001/docs'
    $health = Invoke-RestMethod 'http://127.0.0.1:8001/ai/health'
    if (-not $health.model_available) { Write-Warning "Ollama model $Model unavailable; AI uses labeled threshold fallback. Start Ollama and install the model to enable generated assessments." }
} catch {
    foreach ($item in $processes) { Stop-Process -Id $item.id -ErrorAction SilentlyContinue }
    throw
} finally {
    foreach ($name in $savedEnv.Keys) { [Environment]::SetEnvironmentVariable($name, $savedEnv[$name], 'Process') }
}
