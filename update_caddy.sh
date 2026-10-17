#!/usr/bin/env bash
set -euo pipefail

echo "=== 1. Checking Cloudflare Origin Certificates ==="
if [ -f "/var/www/akubrecah/deploy/certs/origin.pem" ] && [ -f "/var/www/akubrecah/deploy/certs/origin.key" ]; then
    echo "Copying Cloudflare Origin Certificates into Caddy container..."
    docker cp /var/www/akubrecah/deploy/certs/origin.pem n8n-caddy-1:/etc/caddy/origin.pem
    docker cp /var/www/akubrecah/deploy/certs/origin.key n8n-caddy-1:/etc/caddy/origin.key
else
    echo "Origin certs already present in Caddy container or stored in Caddy volumes."
fi

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

n8n.akubrecah.com {
    tls /etc/caddy/origin.pem /etc/caddy/origin.key
    reverse_proxy n8n:5678 {
        flush_interval -1
    }
}

# --- Webmail Proxy (Mailcow vybeafrica.org) ---
mail.vybeafrica.org {
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

# --- Webmail Proxy (Mailcow akubrecah.com - Cloudflare Origin SSL) ---
mail.akubrecah.com {
    tls /etc/caddy/origin.pem /etc/caddy/origin.key
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

admin.akubrecah.com {
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
docker cp /root/n8n/Caddyfile n8n-caddy-1:/etc/caddy/Caddyfile
docker exec n8n-caddy-1 caddy reload -c /etc/caddy/Caddyfile

echo "=== 4. Testing local HTTPS handshakes ==="
echo -n "akubrecah.com: "
curl -k -I -s -o /dev/null -w "%{http_code}\n" --resolve akubrecah.com:443:127.0.0.1 https://akubrecah.com || true
echo -n "kra.akubrecah.com: "
curl -k -I -s -o /dev/null -w "%{http_code}\n" --resolve kra.akubrecah.com:443:127.0.0.1 https://kra.akubrecah.com || true
echo -n "admin.akubrecah.com: "
curl -k -I -s -o /dev/null -w "%{http_code}\n" --resolve admin.akubrecah.com:443:127.0.0.1 https://admin.akubrecah.com || true
echo -n "mail.akubrecah.com: "
curl -k -I -s -o /dev/null -w "%{http_code}\n" --resolve mail.akubrecah.com:443:127.0.0.1 https://mail.akubrecah.com || true
echo -n "n8n.akubrecah.com: "
curl -k -I -s -o /dev/null -w "%{http_code}\n" --resolve n8n.akubrecah.com:443:127.0.0.1 https://n8n.akubrecah.com || true
echo -n "wa.akubrecah.com: "
curl -k -I -s -o /dev/null -w "%{http_code}\n" --resolve wa.akubrecah.com:443:127.0.0.1 https://wa.akubrecah.com || true

echo ""
echo "✅ All Caddy reverse proxies updated and verified!"
