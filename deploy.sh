#!/bin/bash

# Immersa 3D - Cloudflare Pages 部署脚本
# 使用方法: ./deploy.sh [production|preview]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROJECT_NAME="immersa-3d"
DOMAIN="immersa3d.top"

# 检查参数
ENV=${1:-production}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 检查 wrangler 是否安装
check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        print_status "Wrangler CLI 未安装，正在安装..."
        npm install -g wrangler
    else
        print_success "Wrangler CLI 已安装"
    fi
}

# 登录 Cloudflare
login_cloudflare() {
    print_status "检查 Cloudflare 登录状态..."
    if ! wrangler whoami &> /dev/null; then
        print_status "需要登录 Cloudflare，正在打开浏览器..."
        wrangler login
    else
        print_success "已登录 Cloudflare"
    fi
}

# 构建项目
build_project() {
    print_status "开始构建项目..."
    
    # 清理旧构建
    if [ -d "dist" ]; then
        rm -rf dist
        print_status "清理旧的构建文件"
    fi
    
    # 安装依赖
    if [ ! -d "node_modules" ]; then
        print_status "安装依赖..."
        npm ci
    fi
    
    # 构建
    print_status "运行构建命令..."
    npm run build
    
    if [ ! -f "dist/index.html" ]; then
        print_error "构建失败，dist/index.html 不存在"
        exit 1
    fi
    
    print_success "构建完成"
}

# 部署到 Cloudflare Pages
deploy() {
    if [ "$ENV" = "production" ]; then
        print_status "部署到生产环境..."
        wrangler pages deploy dist --project-name=$PROJECT_NAME --branch=main
        print_success "部署成功！"
        echo ""
        print_status "访问地址:"
        echo "  - https://$DOMAIN"
        echo "  - https://immersa-3d.pages.dev"
    else
        print_status "部署到预览环境..."
        PREVIEW_BRANCH="preview-$(date +%Y%m%d-%H%M%S)"
        wrangler pages deploy dist --project-name=$PROJECT_NAME --branch=$PREVIEW_BRANCH
        print_success "预览部署成功！"
    fi
}

# 主流程
main() {
    echo "====================================="
    echo "  Immersa 3D Cloudflare Pages 部署"
    echo "====================================="
    echo ""
    
    # 检查是否在项目根目录
    if [ ! -f "package.json" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    print_status "环境: $ENV"
    print_status "项目名: $PROJECT_NAME"
    print_status "目标域名: $DOMAIN"
    echo ""
    
    # 执行步骤
    check_wrangler
    login_cloudflare
    build_project
    deploy
    
    echo ""
    echo "====================================="
    print_success "部署流程完成！"
    echo "====================================="
}

# 运行主流程
main
