#!/bin/bash

# ================================================================
# Net 知己語音 API - HTTPS 證書設置腳本
# 
# 此腳本會自動：
# 1. 安裝 Certbot（Let's Encrypt 客戶端）
# 2. 獲取 SSL 證書
# 3. 配置自動續期
# 
# 使用方式：
# chmod +x scripts/setup-https.sh
# sudo ./scripts/setup-https.sh api.yourdomain.com
# ================================================================

set -e

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日誌函數
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 檢查是否為 root
if [ "$EUID" -ne 0 ]; then
    log_error "請使用 sudo 運行此腳本"
    exit 1
fi

# 檢查域名參數
DOMAIN=${1:-}
if [ -z "$DOMAIN" ]; then
    log_error "請提供域名參數"
    echo "使用方式: sudo $0 api.yourdomain.com"
    exit 1
fi

log_info "開始為域名 ${DOMAIN} 設置 HTTPS 證書..."

# ============== 步驟 1：檢測系統並安裝 Certbot ==============
log_info "步驟 1/5：檢測系統並安裝 Certbot..."

if [ -f /etc/debian_version ]; then
    # Debian/Ubuntu
    log_info "檢測到 Debian/Ubuntu 系統"
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
elif [ -f /etc/redhat-release ]; then
    # CentOS/RHEL
    log_info "檢測到 CentOS/RHEL 系統"
    yum install -y epel-release
    yum install -y certbot python3-certbot-nginx
elif [ -f /etc/alpine-release ]; then
    # Alpine
    log_info "檢測到 Alpine 系統"
    apk add --no-cache certbot py3-certbot-nginx
else
    log_error "不支持的系統，請手動安裝 Certbot"
    exit 1
fi

log_success "Certbot 安裝完成"

# ============== 步驟 2：檢查 Nginx ==============
log_info "步驟 2/5：檢查 Nginx 狀態..."

if ! command -v nginx &> /dev/null; then
    log_warning "Nginx 未安裝，正在安裝..."
    if [ -f /etc/debian_version ]; then
        apt-get install -y nginx
    elif [ -f /etc/redhat-release ]; then
        yum install -y nginx
    fi
fi

# 創建 certbot webroot 目錄
mkdir -p /var/www/certbot
chown -R www-data:www-data /var/www/certbot 2>/dev/null || chown -R nginx:nginx /var/www/certbot

# 確保 Nginx 運行
systemctl start nginx
systemctl enable nginx

log_success "Nginx 準備就緒"

# ============== 步驟 3：配置臨時 Nginx（用於證書驗證）==============
log_info "步驟 3/5：配置臨時 Nginx 用於證書驗證..."

TEMP_NGINX_CONF="/etc/nginx/conf.d/certbot-temp.conf"
cat > "$TEMP_NGINX_CONF" << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 "Certificate validation in progress...";
        add_header Content-Type text/plain;
    }
}
EOF

# 測試並重載 Nginx
nginx -t && systemctl reload nginx

log_success "臨時配置完成"

# ============== 步驟 4：獲取 SSL 證書 ==============
log_info "步驟 4/5：獲取 SSL 證書..."

# 檢查郵箱
EMAIL=${CERTBOT_EMAIL:-"admin@${DOMAIN}"}

log_info "使用郵箱: ${EMAIL}"
log_info "正在向 Let's Encrypt 申請證書..."

# 使用 webroot 方式獲取證書
certbot certonly --webroot \
    -w /var/www/certbot \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --keep-or-renew

if [ $? -eq 0 ]; then
    log_success "SSL 證書獲取成功！"
else
    log_error "SSL 證書獲取失敗"
    log_warning "請檢查："
    log_warning "1. 域名 DNS 是否正確指向此服務器"
    log_warning "2. 防火牆是否開放 80 端口"
    log_warning "3. 域名是否可以從公網訪問"
    exit 1
fi

# ============== 步驟 5：配置正式 Nginx ==============
log_info "步驟 5/5：配置正式 Nginx..."

# 刪除臨時配置
rm -f "$TEMP_NGINX_CONF"

# 創建正式配置
NGINX_CONF="/etc/nginx/conf.d/voice-api.conf"
cat > "$NGINX_CONF" << EOF
# Net 知己語音 API - Nginx 配置
# 自動生成於 $(date)

upstream voice_api_backend {
    server 127.0.0.1:3001;
    keepalive 32;
}

# HTTP 重定向到 HTTPS
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

# HTTPS 服務器
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    # SSL 證書
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # 安全頭
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # 日誌
    access_log /var/log/nginx/voice-api.access.log;
    error_log /var/log/nginx/voice-api.error.log;

    # 請求體限制
    client_max_body_size 50m;

    # 代理配置
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

# 測試並重載 Nginx
nginx -t && systemctl reload nginx

log_success "Nginx HTTPS 配置完成"

# ============== 配置自動續期 ==============
log_info "配置證書自動續期..."

# 創建續期 cron 任務
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

log_success "自動續期已配置（每日凌晨 3 點檢查）"

# ============== 完成 ==============
echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ HTTPS 設置完成！${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🌐 你的 API 地址："
echo "   https://${DOMAIN}"
echo ""
echo "📋 可用端點："
echo "   POST https://${DOMAIN}/api/asr   - 語音轉文字"
echo "   POST https://${DOMAIN}/api/tts   - 文字轉語音"
echo "   GET  https://${DOMAIN}/api/voices - 語音列表"
echo "   GET  https://${DOMAIN}/health    - 健康檢查"
echo ""
echo "📁 證書位置："
echo "   /etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
echo "   /etc/letsencrypt/live/${DOMAIN}/privkey.pem"
echo ""
echo "🔄 證書會自動續期，無需手動操作"
echo "═══════════════════════════════════════════════════════════"
