# Downloads all photos/graphics from help-wedding.ru (Tilda CDN) into .\assets
# Run from this folder:  powershell -ExecutionPolicy Bypass -File .\download-assets.ps1
$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$json = [System.IO.File]::ReadAllText((Join-Path $root "assets-manifest.json"), [System.Text.Encoding]::UTF8)
$items = $json | ConvertFrom-Json
$ok = 0; $skip = 0; $fail = 0; $i = 0
foreach ($it in $items) {
  $i++
  $dest = Join-Path $root ($it.dest -replace '/', '\')
  $dir = Split-Path -Parent $dest
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  if ((Test-Path $dest) -and ((Get-Item $dest).Length -gt 0)) { $skip++; continue }
  try {
    Invoke-WebRequest -Uri $it.url -OutFile $dest -UseBasicParsing -TimeoutSec 60
    $ok++
    Write-Host ("[{0}/{1}] OK  {2}" -f $i, $items.Count, $it.dest)
  } catch {
    $fail++
    Write-Host ("[{0}/{1}] FAIL {2}  <- {3}" -f $i, $items.Count, $it.dest, $it.url) -ForegroundColor Red
  }
}
Write-Host ""
Write-Host ("Done. downloaded: {0}, already there: {1}, failed: {2}" -f $ok, $skip, $fail) -ForegroundColor Green
if ($fail -gt 0) { Write-Host "Run the script again to retry the failed ones." -ForegroundColor Yellow }
