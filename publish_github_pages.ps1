param(
  [Parameter(Mandatory = $true)]
  [string]$RepoUrl
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".git")) {
  git init
}

git add .
git commit -m "Initial deploy setup for GitHub Pages" 2>$null

git branch -M main

$hasOrigin = $false
try {
  git remote get-url origin | Out-Null
  $hasOrigin = $true
} catch {
  $hasOrigin = $false
}

if ($hasOrigin) {
  git remote set-url origin $RepoUrl
} else {
  git remote add origin $RepoUrl
}

git push -u origin main

Write-Host ""
Write-Host "Push complete."
Write-Host "Next:"
Write-Host "1) GitHub -> Settings -> Pages -> Source = GitHub Actions"
Write-Host "2) Actions tab -> wait for 'Deploy Static Site To GitHub Pages' success"
