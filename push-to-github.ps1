# Run this script to init git, commit, and get ready to push to GitHub.
# Requires: Git installed (https://git-scm.com/download/win or: winget install Git.Git)

$ErrorActionPreference = "Stop"
$repoRoot = $PSScriptRoot
Set-Location $repoRoot

# Find git
$gitExe = $null
if (Get-Command git -ErrorAction SilentlyContinue) {
    $gitExe = "git"
} elseif (Test-Path "C:\Program Files\Git\bin\git.exe") {
    $gitExe = "C:\Program Files\Git\bin\git.exe"
} elseif (Test-Path "C:\Program Files\Git\cmd\git.exe") {
    $gitExe = "C:\Program Files\Git\cmd\git.exe"
}

if (-not $gitExe) {
    Write-Host "Git not found. Install it first:" -ForegroundColor Yellow
    Write-Host "  winget install Git.Git" -ForegroundColor Cyan
    Write-Host "  Or download: https://git-scm.com/download/win" -ForegroundColor Cyan
    Write-Host "Then close and reopen the terminal and run this script again." -ForegroundColor Yellow
    exit 1
}

# Init if needed
if (-not (Test-Path ".git")) {
    & $gitExe init
    Write-Host "Initialized Git repo." -ForegroundColor Green
} else {
    Write-Host "Git repo already exists." -ForegroundColor Green
}

# Remote: only add if not already set
$remotes = & $gitExe remote 2>$null
if ($remotes -notmatch "origin") {
    Write-Host ""
    $url = Read-Host "Paste your GitHub repo URL (e.g. https://github.com/YOUR_USERNAME/REPO_NAME.git)"
    if ($url) {
        & $gitExe remote add origin $url.Trim()
        Write-Host "Remote 'origin' added." -ForegroundColor Green
    }
}

# Stage all
& $gitExe add -A
$status = & $gitExe status --short 2>$null
if (-not $status) {
    Write-Host "Nothing to commit (working tree clean)." -ForegroundColor Yellow
} else {
    & $gitExe commit -m "Initial commit - DocYard property accounting app"
    Write-Host "Committed." -ForegroundColor Green
}

# Push
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
& $gitExe branch -M main 2>$null
$pushResult = & $gitExe push -u origin main 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed. You may need to sign in to GitHub." -ForegroundColor Yellow
    Write-Host $pushResult
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  1. In browser: github.com -> New repository -> Create, then run this script again and paste the repo URL when asked."
    Write-Host "  2. Sign in: git config --global credential.helper manager (then push again)."
    exit 1
}
Write-Host "Done. Your code is on GitHub." -ForegroundColor Green
