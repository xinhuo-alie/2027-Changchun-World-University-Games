$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $project
$port = 5173
$envFile = Join-Path $project '.env'
if (Test-Path -LiteralPath $envFile) {
  $portLine = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^\s*PORT\s*=\s*(\d+)\s*$' } | Select-Object -First 1
  if ($portLine -match '^\s*PORT\s*=\s*(\d+)\s*$') { $port = [int]$Matches[1] }
}
$url = "http://127.0.0.1:$port/"
$node = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $node) { throw 'Node.js was not found. Install Node.js 20 or later and try again.' }
function Test-Server {
  try {
    $response = Invoke-WebRequest -Uri ($url + 'api/places') -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200
  } catch { return $false }
}
if (-not (Test-Server)) {
  $dataDir = Join-Path $project 'data'
  New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
  Start-Process -FilePath $node.Source -ArgumentList 'server/index.js' -WorkingDirectory $project -WindowStyle Hidden -RedirectStandardOutput (Join-Path $dataDir 'server.launch.log') -RedirectStandardError (Join-Path $dataDir 'server.launch-error.log') | Out-Null
  $ready = $false
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-Server) { $ready = $true; break }
  }
  if (-not $ready) { throw "Server did not start. Check data/server.launch-error.log and port $port." }
}
Start-Process $url
