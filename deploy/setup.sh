#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo "  Akubrecah Enterprise & KRA Portal VPS Deployment"
echo "  Domains: akubrecah.com | kra.akubrecah.com | wa.akubrecah.com"
echo "=========================================================="

# 1. Ensure Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker engine..."
    apt-get update && apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

# 2. Check for environment file
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "No .env found. Creating .env from .env.example..."
        cp .env.example .env
        echo "⚠️ Please fill in your real secrets in .env before running production!"
    else
        echo "❌ Error: Neither .env nor .env.example found."
        exit 1
    fi
fi

# 3. Pull / Build & Start containers
echo "Starting production services with Docker Compose..."
docker compose -f deploy/docker-compose.yml up -d --build

echo "Waiting for services to become healthy..."
sleep 10

# 4. Verification
echo "Verifying local service health..."
if curl -s http://localhost/api/health > /dev/null 2>&1 || curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Akubrecah App is HEALTHY and responding!"
else
    echo "ℹ️ Stack is still initializing. Check logs with: docker compose -f deploy/docker-compose.yml logs -f"
fi

echo ""
echo "=========================================================="
echo "  🎉 Deployment Complete!"
echo "=========================================================="
echo "  Main Website:   https://akubrecah.com"
echo "  KRA Portal:     https://kra.akubrecah.com"
echo "  WhatsApp Gateway: https://wa.akubrecah.com"
echo ""
echo "  To view logs:"
echo "    docker compose -f deploy/docker-compose.yml logs -f akubrecah-app"
echo "    docker compose -f deploy/docker-compose.yml logs -f caddy"
echo "=========================================================="
