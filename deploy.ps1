# Immersa 3D - Cloudflare Pages 部署脚本 (Windows PowerShell)
# 使用方法: .\deploy.ps1 [production|preview]

param(
    [string]$Environment = "production"
)

# 配置
$PROJECT_NAME = "immersa-3d"
$DOMAIN = "immersa3d.top"

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

# 检查 wrangler 是否安装
function Check-Wrangler {
    Write-Info "检查 Wrangler CLI..."
    $wrangler = Get-Command wrangler -ErrorAction SilentlyContinue
    if (-not $wrangler) {
        Write-Info "Wrangler CLI 未安装，正在安装..."
        npm install -g wrangler
    } else {
        Write-Success "Wrangler CLI 已安装"
    }
}

# 登录 Cloudflare
function Login-Cloudflare {
    Write-Info "检查 Cloudflare 登录状态..."
    try {
        $whoami = wrangler whoami 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Info "需要登录 Cloudflare，正在打开浏览器..."
            wrangler login
        } else {
            Write-Success "已登录 Cloudflare"
        }
    } catch {
        Write-Info "需要登录 Cloudflare，正在打开浏览器..."
        wrangler login
    }
}

# 构建项目
function Build-Project {
    Write-Info "开始构建项目..."
    
    # 清理旧构建
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
        Write-Info "清理旧的构建文件"
    }
    
    # 安装依赖
    if (-not (Test-Path "node_modules")) {
        Write-Info "安装依赖..."
        npm ci
    }
    
    # 构建
    Write-Info "运行构建命令..."
    npm run build
    
    if (-not (Test-Path "dist\index.html")) {
        Write-Error "构建失败，dist\index.html 不存在"
        exit 1
    }
    
    Write-Success "构建完成"
}

# 部署到 Cloudflare Pages
function Deploy {
    if ($Environment -eq "production") {
        Write-Info "部署到生产环境..."
        wrangler pages deploy dist --project-name=$PROJECT_NAME --branch=main
        Write-Success "部署成功！"
        Write-Host ""
        Write-Info "访问地址:"
        Write-Host "  - https://$DOMAIN"
        Write-Host "  - https://immersa-3d.pages.dev"
    } else {
        $PREVIEW_BRANCH = "preview-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Write-Info "部署到预览环境 (分支: $PREVIEW_BRANCH)..."
        wrangler pages deploy dist --project-name=$PROJECT_NAME --branch=$PREVIEW_BRANCH
        Write-Success "预览部署成功！"
    }
}

# 主流程
function Main {
    Write-Host "====================================="
    Write-Host "  Immersa 3D Cloudflare Pages 部署"
    Write-Host "====================================="
    Write-Host ""
    
    # 检查是否在项目根目录
    if (-not (Test-Path "package.json")) {
        Write-Error "请在项目根目录运行此脚本"
        exit 1
    }
    
    Write-Info "环境: $Environment"
    Write-Info "项目名: $PROJECT_NAME"
    Write-Info "目标域名: $DOMAIN"
    Write-Host ""
    
    # 执行步骤
    Check-Wrangler
    Login-Cloudflare
    Build-Project
    Deploy
    
    Write-Host ""
    Write-Host "====================================="
    Write-Success "部署流程完成！"
    Write-Host "====================================="
}

# 运行主流程
Main
