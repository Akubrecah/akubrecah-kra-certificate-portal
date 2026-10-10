#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo "  Akubrecah KRA Portal - VPS Evolution API v2 Installer"
echo "=========================================================="

APP_DIR="/evolution-whatsapp"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

EVOLUTION_API_KEY="akubrecah_secret_whatsapp_key_2026"
INSTANCE_NAME="akubrecah-kra"
SERVER_URL="http://localhost:8085"
VERCEL_WEBHOOK_URL="https://akubrecah-kra-certificate-portal.vercel.app/api/whatsapp/webhook"

echo "Writing clean docker-compose.yml..."
cat <<EOF > docker-compose.yml
services:
  evolution_postgres:
    image: postgres:15-alpine
    container_name: evolution_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: evolution
      POSTGRES_PASSWORD: evolution_secret_password
      POSTGRES_DB: evolution
    volumes:
      - evolution_postgres_data:/var/lib/postgresql/data
    networks:
      - evolution_net

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
      - "8085:8080"
    environment:
      - SERVER_URL=${SERVER_URL}
      - AUTHENTICATION_API_KEY=${EVOLUTION_API_KEY}
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
      - DEL_INSTANCE=false
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://evolution:evolution_secret_password@evolution_postgres:5432/evolution?schema=public
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - DATABASE_SAVE_MESSAGE_UPDATE=true
      - DATABASE_SAVE_DATA_CONTACTS=true
      - DATABASE_SAVE_DATA_CHATS=true
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
      - evolution_postgres
      - evolution_redis
    networks:
      - evolution_net

volumes:
  evolution_postgres_data:
  evolution_redis_data:
  evolution_instances:

networks:
  evolution_net:
    driver: bridge
EOF

echo "Cleaning up any conflicting old containers..."
docker rm -f evolution_postgres evolution_redis evolution_api 2>/dev/null || true

echo "Pulling required images (Evolution API, Postgres, Redis)..."
docker compose pull

echo "Starting containers..."
docker compose up -d

echo "Waiting for Postgres and Evolution API to initialize (12 seconds)..."
sleep 12

echo "Registering WhatsApp instance '${INSTANCE_NAME}'..."
curl -s -X POST "http://localhost:8085/instance/create" \
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
echo "  API URL:       http://<YOUR_VPS_IP>:8085"
echo "  API Key:       ${EVOLUTION_API_KEY}"
echo "  Instance Name: ${INSTANCE_NAME}"
echo ""
echo "  To view the QR code in your terminal, run:"
echo "  docker logs -f evolution_api"
echo ""
echo "  Add these 4 variables in your Vercel Dashboard Settings:"
echo "  EVOLUTION_API_URL=http://<YOUR_VPS_IP>:8085"
echo "  EVOLUTION_API_KEY=${EVOLUTION_API_KEY}"
echo "  EVOLUTION_INSTANCE_NAME=${INSTANCE_NAME}"
echo "  N8N_KRA_DELIVERY_WEBHOOK=https://n8n.vybeafrica.org/webhook/kra-delivery"
echo "=========================================================="
