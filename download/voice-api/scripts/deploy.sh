#!/bin/bash

# ================================================================
# Net 知己語音 API - 完整部署腳本
# 
# 此腳本會自動完成：
# 1. 安裝 Docker（如未安裝）
# 2. 構建並啟動 API 服務
# 3. 安裝並配置 Nginx
# 4. 獲取 SSL 證書
# 
# 使用方式：
# chmod +x scripts/deploy.sh
# sudo ./scripts/deploy.sh api.yourdomain.com
# ================================================================

set -e

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 檢查 root
if [ "$EUID" -ne 0 ]; then
    log_error "請使用 sudo 運行此腳本"
    exit 1
fi

# 參數檢查
DOMAIN=${1:-}
if [ -z "$DOMAIN" ]; then
    log_error "請提供域名參數"
    echo "使用方式: sudo $0 api.yourdomain.com"
    exit 1
fi

EMAIL=${2:-"admin@${DOMAIN}"}

# 獲取腳本所在目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "     Net 知己 語音 API - 自動部署腳本"
echo "═══════════════════════════════════════════════════════════"
echo "域名: ${DOMAIN}"
echo "郵箱: ${EMAIL}"
echo "項目目錄: ${PROJECT_DIR}"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ============== 步驟 1：安裝 Docker ==============
log_info "步驟 1/5：檢查並安裝 Docker..."

if ! command -v docker &> /dev/null; then
    log_info "Docker 未安裝，正在安裝..."
    
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        apt-get update
        apt-get install -y ca-certificates curl gnupg
        install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        chmod a+r /etc/apt/keyrings/docker.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        yum install -y yum-utils
        yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    fi
    
    systemctl start docker
    systemctl enable docker
    log_success "Docker 安裝完成"
else
    log_success "Docker 已安裝"
fi

# ============== 步驟 2：安裝 Nginx ==============
log_info "步驟 2/5：安裝 Nginx..."

if ! command -v nginx &> /dev/null; then
    if [ -f /etc/debian_version ]; then
        apt-get install -y nginx
    elif [ -f /etc/redhat-release ]; then
        yum install -y nginx
    fi
    systemctl start nginx
    systemctl enable nginx
    log_success "Nginx 安裝完成"
else
    log_success "Nginx 已安裝"
fi

# ============== 步驟 3：構建並啟動 API 服務 ==============
log_info "步驟 3/5：構建並啟動 API 服務..."

cd "$PROJECT_DIR"

# 生成 API Keys
API_KEY="sk_$(openssl rand -hex 24)"
ADMIN_SECRET="$(openssl rand -hex 16)"

log_info "生成的 API Key: ${API_KEY}"
log_info "生成的 Admin Secret: ${ADMIN_SECRET}"

# 創建 .env 文件
cat > .env << EOF
PORT=3001
NODE_ENV=production
API_KEYS=${API_KEY}
ADMIN_SECRET=${ADMIN_SECRET}
EOF

# 構建並啟動 Docker 容器
docker compose down 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

log_success "API 服務已啟動"

# ============== 步驟 4：安裝 Certbot 並獲取證書 ==============
log_info "步驟 4/5：獲取 SSL 證書..."

# 安裝 Certbot
if ! command -v certbot &> /dev/null; then
    if [ -f /etc/debian_version ]; then
        apt-get install -y certbot python3-certbot-nginx
    elif [ -f /etc/redhat-release ]; then
        yum install -y epel-release
        yum install -y certbot python3-certbot-nginx
    fi
fi

# 創建 certbot webroot
mkdir -p /var/www/certbot
chown -R www-data:www-data /var/www/certbot 2>/dev/null || chown -R nginx:nginx /var/www/certbot

# 臨時 Nginx 配置（用於驗證）
cat > /etc/nginx/conf.d/certbot-temp.conf << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        proxy_pass http://127.0.0.1:3001;
    }
}
EOF

nginx -t && systemctl reload nginx

# 獲取證書
certbot certonly --webroot \
    -w /var/www/certbot \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive

log_success "SSL 證書獲取成功"

# ============== 步驟 5：配置正式 Nginx ==============
log_info "步驟 5/5：配置 Nginx..."

# 刪除臨時配置
rm -f /etc/nginx/conf.d/certbot-temp.conf

# 創建正式配置
cat > /etc/nginx/conf.d/voice-api.conf << EOF
upstream voice_api_backend {
    server 127.0.0.1:3001;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    access_log /var/log/nginx/voice-api.access.log;
    error_log /var/log/nginx/voice-api.error.log;

    client_max_body_size 50m;

    location / {
        proxy_pass http://voice_api_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }

    location /health {
        proxy_pass http://voice_api_backend/health;
        access_log off;
    }
}
EOF

nginx -t && systemctl reload nginx

# 配置自動續期
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

log_success "部署完成！"

# ============== 輸出結果 ==============
echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ 部署成功！${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🌐 API 地址: https://${DOMAIN}"
echo ""
echo "🔑 API Key: ${API_KEY}"
echo "🔐 Admin Secret: ${ADMIN_SECRET}"
echo ""
echo "📋 API 端點："
echo "   POST https://${DOMAIN}/api/asr"
echo "   POST https://${DOMAIN}/api/tts"
echo "   GET  https://${DOMAIN}/api/voices"
echo ""
echo "🔧 管理 API："
echo "   GET    https://${DOMAIN}/admin/keys"
echo "   POST   https://${DOMAIN}/admin/keys"
echo "   DELETE https://${DOMAIN}/admin/keys/:key"
echo ""
echo "💡 請妥善保管 API Key 和 Admin Secret！"
echo "═══════════════════════════════════════════════════════════"

# 保存憑證到文件
cat > "${PROJECT_DIR}/credentials.txt" << EOF
# Net 知己語音 API 憑證
# 生成時間: $(date)

域名: ${DOMAIN}
API 地址: https://${DOMAIN}

API Key: ${API_KEY}
Admin Secret: ${ADMIN_SECRET}

# 使用示例：
# curl -X POST https://${DOMAIN}/api/tts \
#   -H "x-api-key: ${API_KEY}" \
#   -H "Content-Type: application/json" \
#   -d '{"text":"你好世界"}' --output test.wav
EOF

log_info "憑證已保存到: ${PROJECT_DIR}/credentials.txt"
