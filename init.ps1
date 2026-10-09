Write-Host "Initializing Job Aggregator Project..." -ForegroundColor Green

$ProjectRoot = $PSScriptRoot

# Initialize Frontend
Write-Host "Setting up Frontend..." -ForegroundColor Cyan
Set-Location "$ProjectRoot\frontend"
if (Get-Command npm -ErrorAction SilentlyContinue) {
    npm install
    Write-Host "Frontend dependencies installed." -ForegroundColor Green
} else {
    Write-Host "npm not found. Please install Node.js." -ForegroundColor Red
}

# Initialize Backend
Write-Host "Setting up Backend..." -ForegroundColor Cyan
Set-Location "$ProjectRoot\backend"
if (Get-Command python -ErrorAction SilentlyContinue) {
    python -m venv venv
    .\venv\Scripts\activate
    pip install -r requirements.txt
    Write-Host "Backend setup complete. To activate venv, run '.\backend\venv\Scripts\activate'" -ForegroundColor Green
} else {
    Write-Host "python not found. Please install Python." -ForegroundColor Red
}

Write-Host "Initialization complete! To start the backend, run 'cd backend' and 'uvicorn app.main:app --reload'." -ForegroundColor Green
Set-Location $ProjectRoot
