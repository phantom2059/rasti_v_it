# PowerShell скрипт для подключения к серверу и сборки Docker контейнера
# Использование: .\deploy_to_server.ps1

$serverIP = "46.16.12.107"
$serverUser = "root"
$serverPassword = "84EqEuj0hwQG"
$serverName = "spb-1"

Write-Host "=== Подключение к серверу $serverName ($serverIP) ===" -ForegroundColor Green

# Проверяем доступность сервера
Write-Host "Проверка доступности сервера..." -ForegroundColor Yellow
$pingResult = Test-Connection -ComputerName $serverIP -Count 1 -Quiet

if (-not $pingResult) {
    Write-Host "ВНИМАНИЕ: Сервер не отвечает на ping. Возможно, требуется VPN или другой способ подключения." -ForegroundColor Red
    Write-Host "Попробуйте подключиться вручную через SSH:" -ForegroundColor Yellow
    Write-Host "ssh root@$serverIP" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Или выполните команды на сервере вручную:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Подключитесь к серверу:" -ForegroundColor Cyan
    Write-Host "   ssh root@$serverIP" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Перейдите в директорию проекта:" -ForegroundColor Cyan
    Write-Host "   cd /app/autoexam-app" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Выполните сборку:" -ForegroundColor Cyan
    Write-Host "   docker-compose -f docker-compose.gpu.yml up --build -d" -ForegroundColor White
    Write-Host ""
    Write-Host "Или используйте подготовленный скрипт:" -ForegroundColor Cyan
    Write-Host "   chmod +x build_on_server.sh && ./build_on_server.sh" -ForegroundColor White
    exit 1
}

Write-Host "Сервер доступен!" -ForegroundColor Green

# Пробуем подключиться через SSH
Write-Host "Попытка подключения через SSH..." -ForegroundColor Yellow

# Для автоматической передачи пароля на Windows может потребоваться sshpass или другие инструменты
# Попробуем использовать plink (PuTTY) если доступен, или стандартный ssh

$sshCommand = @"
cd /app/autoexam-app || cd ~/autoexam-app || cd /root/autoexam-app
echo '=== Начало сборки ==='
docker-compose -f docker-compose.gpu.yml down 2>/dev/null || true
docker build -f Dockerfile.gpu -t autoexam-app:gpu .
docker-compose -f docker-compose.gpu.yml up --build -d
docker-compose -f docker-compose.gpu.yml logs --tail=50
"@

Write-Host ""
Write-Host "=== Команды для выполнения на сервере ===" -ForegroundColor Green
Write-Host ""
Write-Host "Подключитесь к серверу:" -ForegroundColor Cyan
Write-Host "ssh root@$serverIP" -ForegroundColor White
Write-Host ""
Write-Host "Пароль: $serverPassword" -ForegroundColor Yellow
Write-Host ""
Write-Host "После подключения выполните:" -ForegroundColor Cyan
Write-Host $sshCommand -ForegroundColor White
Write-Host ""
Write-Host "Или используйте подготовленный скрипт build_on_server.sh" -ForegroundColor Cyan

# Попробуем использовать plink если доступен
$plinkPath = Get-Command plink -ErrorAction SilentlyContinue
if ($plinkPath) {
    Write-Host "Обнаружен plink, попытка автоматического подключения..." -ForegroundColor Yellow
    # Используем plink для автоматического подключения
    $plinkCommand = "plink -ssh -pw `"$serverPassword`" $serverUser@$serverIP `"$sshCommand`""
    Write-Host "Выполнение: $plinkCommand" -ForegroundColor Cyan
    Invoke-Expression $plinkCommand
} else {
    Write-Host "plink не найден. Используйте команды выше для ручного подключения." -ForegroundColor Yellow
}

