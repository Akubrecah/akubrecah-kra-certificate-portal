#!/usr/bin/env bash
set -euo pipefail

echo "=== 1. Copying Cloudflare Origin Certificates into Caddy container ==="
docker cp /var/www/akubrecah/deploy/certs/origin.pem n8n-caddy-1:/etc/caddy/origin.pem
docker cp /var/www/akubrecah/deploy/certs/origin.key n8n-caddy-1:/etc/caddy/origin.key

echo "=== 2. Writing Caddyfile with all domains and certificates ==="
cat << 'CADDY_CONFIG' > /root/n8n/Caddyfile
vybeafrica.org, www.vybeafrica.org, staff.vybeafrica.org {
    reverse_proxy 172.23.0.1:5000
}

n8n.vybeafrica.org {
    reverse_proxy n8n:5678 {
        flush_interval -1
    }
}

# --- Webmail Proxy (Mailcow) ---
mail.vybeafrica.org, mail.akubrecah.com {
    reverse_proxy https://mailcowdockerized-nginx-mailcow-1:8443 {
        transport http {
            tls_insecure_skip_verify
        }
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-Proto https
        header_up X-Forwarded-Port 443
    }
}

lhci.vybeafrica.org {
    encode zstd gzip
    reverse_proxy vybe-lhci-server:9001
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}

akubrecah.com, www.akubrecah.com {
    tls /etc/caddy/origin.pem /etc/caddy/origin.key
    encode zstd gzip
    reverse_proxy 172.23.0.1:3005
}

kra.akubrecah.com {
    tls /etc/caddy/origin.pem /etc/caddy/origin.key
    encode zstd gzip
    reverse_proxy 172.23.0.1:3005
}

wa.akubrecah.com {
    tls /etc/caddy/origin.pem /etc/caddy/origin.key
    encode zstd gzip
    reverse_proxy 172.23.0.1:8085
}
CADDY_CONFIG

echo "=== 3. Reloading Caddy in n8n-caddy-1 ==="
docker exec n8n-caddy-1 caddy reload -c /etc/caddy/Caddyfile

echo "=== 4. Testing local HTTPS handshake ==="
curl -k -I -H "Host: akubrecah.com" https://localhost

echo ""
echo "✅ SUCCESS! Caddy is now serving akubrecah.com and kra.akubrecah.com with SSL!"
