# Configura los secretos del Worker en Cloudflare.
# Ejecuta este archivo con PowerShell desde la carpeta worker.
# Los valores se escriben en la terminal y no se guardan en el repositorio.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
  $node = "C:\Users\Ale-PC\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe"
}

$cli = Join-Path $PSScriptRoot "node_modules\wrangler\wrangler-dist\cli.js"
if (-not (Test-Path $cli)) {
  throw "No se encontró Wrangler en worker\node_modules. Avísame para reinstalarlo."
}

Write-Host ""
Write-Host "Se configurarán tres secretos en Cloudflare." -ForegroundColor Cyan
Write-Host ""

Write-Host "1/3  ADMIN_PASSWORD: la contraseña que usarás para entrar al panel." -ForegroundColor Yellow
& $node --no-warnings --experimental-vm-modules $cli secret put ADMIN_PASSWORD

Write-Host ""
Write-Host "2/3  SESSION_SECRET: pulsa Enter y pega una cadena larga y aleatoria." -ForegroundColor Yellow
Write-Host "     Si no tienes una, usa esta:" -ForegroundColor DarkGray
$generada = -join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
Write-Host "     $generada" -ForegroundColor DarkGray
& $node --no-warnings --experimental-vm-modules $cli secret put SESSION_SECRET

Write-Host ""
Write-Host "3/3  GITHUB_TOKEN: el token fine-grained con Contents: Read and write." -ForegroundColor Yellow
& $node --no-warnings --experimental-vm-modules $cli secret put GITHUB_TOKEN

Write-Host ""
Write-Host "Listo. Abre https://kryptale.github.io/portafolio-civil/admin/" -ForegroundColor Green
Write-Host "y usa esta URL de Worker:" -ForegroundColor Green
Write-Host "https://portafolio-admin.ale-aguilera-ve.workers.dev" -ForegroundColor Cyan
Write-Host ""
Read-Host "Pulsa Enter para cerrar"
