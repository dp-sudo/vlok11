#!/bin/bash

# Immersa 3D - Cloudflare 域名绑定配置脚本
# 使用方法: ./setup-domain.sh <你的 Cloudflare API Token>

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
PROJECT_NAME="immersa-3d"
DOMAIN="immersa3d.top"
ACCOUNT_ID="0f8f1da12e94b759dbb330c45ef4f8c0"

# 检查参数
if [ -z "$1" ]; then
    echo -e "${RED}错误: 需要提供 Cloudflare API Token${NC}"
    echo ""
    echo "如何获取 API Token:"
    echo "1. 访问 https://dash.cloudflare.com/profile/api-tokens"
    echo "2. 点击 'Create Token'"
    echo "3. 选择 'Custom token'"
    echo "4. 权限设置:"
    echo "   - Zone:Read, Zone:Edit (用于管理域名)"
    echo "   - Page Rules:Edit (可选)"
    echo "   - 区域资源: 选择 immersa3d.top"
    echo "5. 复制生成的 Token"
    echo ""
    echo "使用方法:"
    echo "  ./setup-domain.sh YOUR_API_TOKEN"
    exit 1
fi

API_TOKEN="$1"

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

# 测试 API Token
test_token() {
    print_status "测试 API Token..."
    
    response=$(curl -s -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json")
    
    if echo "$response" | grep -q "\"success\":true"; then
        print_success "API Token 有效"
    else
        print_error "API Token 无效"
        echo "响应: $response"
        exit 1
    fi
}

# 获取 Zone ID
get_zone_id() {
    print_status "查找 immersa3d.top 的 Zone ID..."
    
    response=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json")
    
    ZONE_ID=$(echo "$response" | grep -oP '"id":"\K[^"]+' | head -1)
    
    if [ -z "$ZONE_ID" ]; then
        print_error "未找到 immersa3d.top 的 Zone"
        echo "请确保:"
        echo "1. 域名已在 Cloudflare 注册或添加"
        echo "2. API Token 有 Zone:Read 权限"
        echo ""
        echo "响应: $response"
        exit 1
    fi
    
    print_success "找到 Zone ID: $ZONE_ID"
}

# 添加自定义域名到 Pages 项目
add_domain() {
    print_status "添加自定义域名到 Pages 项目..."
    
    response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "{\"name\":\"$DOMAIN\"}")
    
    if echo "$response" | grep -q "\"success\":true"; then
        print_success "域名添加成功"
        echo "响应: $response"
    else
        if echo "$response" | grep -q "already exists"; then
            print_warning "域名已存在，跳过添加"
        else
            print_error "添加域名失败"
            echo "响应: $response"
            exit 1
        fi
    fi
}

# 获取域名状态
get_domain_status() {
    print_status "检查域名状态..."
    
    response=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json")
    
    echo "域名列表:"
    echo "$response" | grep -oP '"name":"[^"]+"' | sed 's/"name":"/  - /g; s/"//g'
}

# 主流程
main() {
    echo "====================================="
    echo "  Immersa 3D 域名配置"
    echo "  目标: $DOMAIN"
    echo "====================================="
    echo ""
    
    test_token
    get_zone_id
    add_domain
    get_domain_status
    
    echo ""
    echo "====================================="
    print_success "域名配置完成！"
    echo "====================================="
    echo ""
    echo "接下来:"
    echo "1. 访问 Cloudflare Dashboard 确认:"
    echo "   https://dash.cloudflare.com/$ACCOUNT_ID/pages/view/$PROJECT_NAME/domains"
    echo ""
    echo "2. 等待 SSL 证书自动签发 (通常几分钟)"
    echo ""
    echo "3. 访问你的域名:"
    echo "   https://$DOMAIN"
}

# 运行主流程
main
