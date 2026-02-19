# DocYard - Commit and push to GitHub
$ErrorActionPreference = "Stop"
$repoRoot = "c:\Users\AustinDuffy\Desktop\Work\AP\HFUF"
$git = "C:\Program Files\Git\bin\git.exe"

Set-Location $repoRoot
& $git add -A
& $git status --short
& $git commit -m "DocYard: unified upload, feedback 1-5 + categories, Railway deploy, Supabase-ready"
& $git push origin main
