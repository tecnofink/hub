# Inicia a Firebase Emulator Suite para desenvolvimento local.
# - Usa o Java do sistema se existir; senão, o JRE portátil em .tools\jre
#   (baixe com: Invoke-WebRequest api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jre/hotspot/normal/eclipse -OutFile jre.zip)
# - O tmpdir curto evita o limite de caminho dos sockets Unix do Java no Windows.

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
  $jreDir = Get-ChildItem ".tools\jre" -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $jreDir) {
    Write-Error "Java não encontrado. Instale um JRE 11+ ou extraia um JRE portátil em .tools\jre."
  }
  $env:PATH = "$($jreDir.FullName)\bin;" + $env:PATH
}

$env:JAVA_TOOL_OPTIONS = "-Djdk.net.unixdomain.tmpdir=C:\Users\Public"

npm --prefix functions run build
npx firebase emulators:start --project demo-portal-flux
