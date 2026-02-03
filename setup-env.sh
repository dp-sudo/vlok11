#!/bin/bash

# Immersa 3D - Cloudflare 环境变量配置脚本
# 使用方法: ./setup-env.sh <你的 Cloudflare API Token>

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
PROJECT_NAME="immersa-3d"
ACCOUNT_ID="0f8f1da12e94b759dbb330c45ef4f8c0"

# 检查参数
if [ -z "$1" ]; then
    echo -e "${RED}错误: 需要提供 Cloudflare API Token${NC}"
    echo ""
    echo "使用方法:"
    echo "  ./setup-env.sh YOUR_API_TOKEN"
    echo ""
    echo "获取 Token: https://dash.cloudflare.com/profile/api-tokens"
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

# 设置环境变量
set_env_var() {
    local name=$1
    local value=$2
    
    print_status "设置环境变量: $name"
    
    response=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/env_vars/$name" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "{\"value\":\"$value\"}")
    
    if echo "$response" | grep -q "\"success\":true"; then
        print_success "环境变量 $name 设置成功"
    else
        print_error "设置环境变量 $name 失败"
        echo "响应: $response"
    fi
}

# 从 .env 文件读取变量
load_env_from_file() {
    if [ ! -f ".env" ]; then
        print_warning "未找到 .env 文件"
        return 1
    fi
    
    print_status "从 .env 文件读取环境变量..."
    
    # 读取 VITE_ 开头的变量
    while IFS='=' read -r name value; do
        # 跳过注释和空行
        [[ "$name" =~ ^#.*$ ]] && continue
        [[ -z "$name" ]] && continue
        
        # 只处理 VITE_ 开头的变量
        if [[ "$name" =~ ^VITE_ ]]; then
            # 去除可能的引号
            value=$(echo "$value" | sed 's/^"//;s/"$//;s/^'\''//;s/'\''$//')
            set_env_var "$name" "$value"
        fi
    done < ".env"
}

# 主流程
main() {
    echo "====================================="
    echo "  Immersa 3D 环境变量配置"
    echo "====================================="
    echo ""
    
    test_token
    
    # 尝试从 .env 文件加载
    if load_env_from_file; then
        echo ""
        print_success "环境变量配置完成！"
    else
        echo ""
        print_warning "请手动在 Cloudflare Dashboard 设置环境变量:"
        echo "  https://dash.cloudflare.com/$ACCOUNT_ID/pages/view/$PROJECT_NAME/settings/environment-variables"
    fi
    
    echo ""
    echo "====================================="
    echo ""
    echo "需要设置的环境变量:"
    echo "  - VITE_GEMINI_API_KEY"
    echo ""
    echo "====================================="
}

# 运行主流程
main
