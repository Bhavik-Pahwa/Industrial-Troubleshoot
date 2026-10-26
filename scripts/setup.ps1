$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
Push-Location $repo
try {
    # Python 3.13 supports both the AI's pinned dependencies and the backend.
    foreach ($service in @('backend', 'AI')) {
        if (-not (Test-Path "$service/.venv/Scripts/python.exe")) {
            py -3.13 -m venv "$service/.venv"
            if ($LASTEXITCODE) { throw "Could not create $service Python environment" }
        }
    }
    & backend/.venv/Scripts/python -m pip install -r backend/requirements-dev.lock
    if ($LASTEXITCODE) { throw 'Backend dependency installation failed' }
    & backend/.venv/Scripts/python -m pip install --no-deps -e backend
    if ($LASTEXITCODE) { throw 'Backend installation failed' }
    & AI/.venv/Scripts/python -m pip install -r AI/requirements.txt
    if ($LASTEXITCODE) { throw 'AI installation failed' }
    Push-Location FRONTEND
    try {
        npm ci
        if ($LASTEXITCODE) { throw 'Frontend installation failed' }
    } finally { Pop-Location }
} finally { Pop-Location }
