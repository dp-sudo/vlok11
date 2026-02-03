# Immersa 3D - Cloudflare 域名绑定配置脚本 (Windows)
# 使用方法: .\setup-domain.ps1 <你的 Cloudflare API Token>

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiToken
)

# 配置
$PROJECT_NAME = "immersa-3d"
$DOMAIN = "immersa3d.top"
$ACCOUNT_ID = "0f8f1da12e94b759dbb330c45ef4f8c0"

# 颜色函数
function Write-Info($message) {
    Write-Host "[INFO] $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "[SUCCESS] $message" -ForegroundColor Green
}

function Write-Error($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

function Write-Warning($message) {
    Write-Host "[WARNING] $message" -ForegroundColor Yellow
}

# 测试 API Token
function Test-Token {
    Write-Info "测试 API Token..."
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" `
            -Headers @{
                "Authorization" = "Bearer $ApiToken"
                "Content-Type" = "application/json"
            } `
            -Method GET
        
        if ($response.success) {
            Write-Success "API Token 有效"
        } else {
            throw "API Token 验证失败"
        }
    } catch {
        Write-Error "API Token 无效"
        Write-Host "错误: $_"
        exit 1
    }
}

# 获取 Zone ID
function Get-ZoneId {
    Write-Info "查找 immersa3d.top 的 Zone ID..."
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" `
            -Headers @{
                "Authorization" = "Bearer $ApiToken"
                "Content-Type" = "application/json"
            } `
            -Method GET
        
        if ($response.success -and $response.result.Count -gt 0) {
            $script:ZONE_ID = $response.result[0].id
            Write-Success "找到 Zone ID: $ZONE_ID"
        } else {
            throw "未找到 immersa3d.top 的 Zone"
        }
    } catch {
        Write-Error "查找 Zone 失败"
        Write-Host "请确保:"
        Write-Host "1. 域名已在 Cloudflare 注册或添加"
        Write-Host "2. API Token 有 Zone:Read 权限"
        Write-Host ""
        Write-Host "错误: $_"
        exit 1
    }
}

# 添加自定义域名到 Pages 项目
function Add-Domain {
    Write-Info "添加自定义域名到 Pages 项目..."
    
    try {
        $body = @{
            name = $DOMAIN
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains" `
            -Headers @{
                "Authorization" = "Bearer $ApiToken"
                "Content-Type" = "application/json"
            } `
            -Method POST `
            -Body $body
        
        if ($response.success) {
            Write-Success "域名添加成功"
        } else {
            throw "添加域名失败"
        }
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode -eq 400) {
            Write-Warning "域名可能已存在，跳过添加"
        } else {
            Write-Error "添加域名失败: $_"
            exit 1
        }
    }
}

# 获取域名状态
function Get-DomainStatus {
    Write-Info "检查域名状态..."
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains" `
            -Headers @{
                "Authorization" = "Bearer $ApiToken"
                "Content-Type" = "application/json"
            } `
            -Method GET
        
        Write-Host "域名列表:"
        foreach ($domain in $response.result) {
            Write-Host "  - $($domain.name)" -ForegroundColor Cyan
        }
    } catch {
        Write-Warning "获取域名状态失败: $_"
    }
}

# 主流程
function Main {
    Write-Host "====================================="
    Write-Host "  Immersa 3D 域名配置"
    Write-Host "  目标: $DOMAIN"
    Write-Host "====================================="
    Write-Host ""
    
    Test-Token
    Get-ZoneId
    Add-Domain
    Get-DomainStatus
    
    Write-Host ""
    Write-Host "====================================="
    Write-Success "域名配置完成！"
    Write-Host "====================================="
    Write-Host ""
    Write-Info "接下来:"
    Write-Host "1. 访问 Cloudflare Dashboard 确认:"
    Write-Host "   https://dash.cloudflare.com/$ACCOUNT_ID/pages/view/$PROJECT_NAME/domains"
    Write-Host ""
    Write-Host "2. 等待 SSL 证书自动签发 (通常几分钟)"
    Write-Host ""
    Write-Host "3. 访问你的域名:"
    Write-Host "   https://$DOMAIN" -ForegroundColor Green
}

# 运行主流程
Main
