#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo "  Akubrecah KRA Portal - VPS Evolution API Installer"
echo "=========================================================="

APP_DIR="/evolution-whatsapp"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

EVOLUTION_API_KEY="akubrecah_secret_whatsapp_key_2026"
INSTANCE_NAME="akubrecah-kra"
SERVER_URL="http://localhost:8080"
VERCEL_WEBHOOK_URL="https://akubrecah-kra-certificate-portal.vercel.app/api/whatsapp/webhook"

echo "Writing clean docker-compose.yml..."
cat <<EOF > docker-compose.yml
services:
  evolution_redis:
    image: redis:7-alpine
    container_name: evolution_redis
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - evolution_redis_data:/data
    networks:
      - evolution_net

  evolution:
    image: evoapicloud/evolution-api:latest
    container_name: evolution_api
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=${SERVER_URL}
      - AUTHENTICATION_API_KEY=${EVOLUTION_API_KEY}
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
      - DEL_INSTANCE=false
      - STORE_MESSAGES=true
      - STORE_MESSAGE_UP=true
      - CLEAN_STORE_MESSAGES=true
      - CLEAN_STORE_MESSAGE_UP=true
      - CLEAN_STORE_CONTACTS=true
      - CLEAN_STORE_CHATS=true
      - DATABASE_ENABLED=false
      - REDIS_ENABLED=true
      - REDIS_URI=redis://evolution_redis:6379
      - REDIS_PREFIX_KEY=evolution
      - WEBHOOK_GLOBAL_URL=${VERCEL_WEBHOOK_URL}
      - WEBHOOK_GLOBAL_ENABLED=true
      - WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false
      - WEBHOOK_EVENTS_MESSAGES_UPSERT=true
      - WEBHOOK_EVENTS_CONNECTION_UPDATE=true
      - WEBHOOK_EVENTS_QRCODE_UPDATED=true
    volumes:
      - evolution_instances:/evolution/instances
    depends_on:
      - evolution_redis
    networks:
      - evolution_net

volumes:
  evolution_redis_data:
  evolution_instances:

networks:
  evolution_net:
    driver: bridge
EOF

echo "Cleaning up any old or conflicting containers..."
docker rm -f evolution_redis evolution_api 2>/dev/null || true

echo "Pulling official Evolution API image..."
docker compose pull

echo "Starting containers..."
docker compose up -d

echo "Waiting for Evolution API to initialize (10 seconds)..."
sleep 10

echo "Registering WhatsApp instance '${INSTANCE_NAME}'..."
curl -s -X POST "http://localhost:8080/instance/create" \
  -H "apikey: ${EVOLUTION_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "'"${INSTANCE_NAME}"'",
    "token": "'"${EVOLUTION_API_KEY}"'",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }' || true

echo ""
echo "=========================================================="
echo "  Akubrecah KRA Evolution API is now LIVE on your VPS!"
echo "=========================================================="
echo "  API URL:       http://<YOUR_VPS_IP>:8080"
echo "  API Key:       ${EVOLUTION_API_KEY}"
echo "  Instance Name: ${INSTANCE_NAME}"
echo ""
echo "  To link WhatsApp (Scan QR Code):"
echo "  Visit in browser: http://<YOUR_VPS_IP>:8080/instance/connect/${INSTANCE_NAME}"
echo ""
echo "  Add these 4 variables in your Vercel Dashboard Settings:"
echo "  EVOLUTION_API_URL=http://<YOUR_VPS_IP>:8080"
echo "  EVOLUTION_API_KEY=${EVOLUTION_API_KEY}"
echo "  EVOLUTION_INSTANCE_NAME=${INSTANCE_NAME}"
echo "  N8N_KRA_DELIVERY_WEBHOOK=https://n8n.vybeafrica.org/webhook/kra-delivery"
echo "=========================================================="
