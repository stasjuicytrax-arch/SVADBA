# Переносит токен бота и ключ релея из функции stevent-leads (st-event.com) в функцию vtitrah-leads
# (help-wedding.ru): оба сайта шлют заявки одним ботом в канал @helpppevent через релей stevent-relay.
# Значения нигде не показываются и не сохраняются в файлах.
# Запуск: powershell -ExecutionPolicy Bypass -File .\copy-secrets.ps1

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$yc = Join-Path $env:USERPROFILE 'yandex-cloud\bin\yc.exe'

Write-Host ''
Write-Host '1/2 Беру секреты из stevent-leads...' -ForegroundColor Cyan
$json = & $yc serverless function version get-by-tag --function-name stevent-leads --tag '$latest' --format json 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host 'Не получилось прочитать stevent-leads. Пришлите Claude скриншот этого окна.' -ForegroundColor Red; exit 1 }
$src = ($json | Out-String | ConvertFrom-Json).environment
if (-not $src.TELEGRAM_BOT_TOKEN -or -not $src.TELEGRAM_RELAY_KEY) { Write-Host 'В stevent-leads нет токена. Сначала запустите stevent\server\setup-secrets.ps1.' -ForegroundColor Red; exit 1 }

Write-Host '2/2 Кладу их в vtitrah-leads (новая версия функции)...' -ForegroundColor Cyan
$envs = "TELEGRAM_CHAT_ID=@helpppevent,TELEGRAM_API_BASE=https://stevent-relay.ngperm.workers.dev,LEADS_FILE=/tmp/leads.jsonl,TELEGRAM_BOT_TOKEN=$($src.TELEGRAM_BOT_TOKEN),TELEGRAM_RELAY_KEY=$($src.TELEGRAM_RELAY_KEY)"
& $yc serverless function version create --function-name vtitrah-leads --runtime nodejs22 --entrypoint yandex-function.handler --memory 128m --execution-timeout 20s --source-path $here --environment $envs 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host 'Не получилось обновить vtitrah-leads. Пришлите Claude скриншот этого окна.' -ForegroundColor Red; exit 1 }

$src = $null; $json = $null; $envs = $null
Write-Host ''
Write-Host 'Готово! Напишите Claude: «секреты перенесены».' -ForegroundColor Green
