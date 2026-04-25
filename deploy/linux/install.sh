#!/bin/bash
set -e

# Netwrix Intelligence Dashboard — Linux Installer
# Supports: Ubuntu 20.04+, Debian 11+, RHEL 8+

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[NID]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}  $1"; }
warn()  { echo -e "${YELLOW}[!]${NC}  $1"; }
error() { echo -e "${RED}[ERR]${NC} $1"; exit 1; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Netwrix Intelligence Dashboard — Linux Installer   ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Prerequisites ─────────────────────────────────────────────────────────────
info "Checking prerequisites..."
command -v docker      >/dev/null 2>&1 || error "Docker not found. Install Docker Engine first: https://docs.docker.com/engine/install/"
command -v docker      >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 || error "Docker Compose v2 not found."
ok "Docker ready"

# ── Install directory ─────────────────────────────────────────────────────────
INSTALL_DIR="${NID_DIR:-/opt/netwrix-intelligence-dashboard}"
info "Installing to $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"/{tools,ssl,logs}
cp -r . "$INSTALL_DIR/"
cd "$INSTALL_DIR"

# ── Auto-generate secrets (no manual config needed — all done via web UI) ──────
info "Generating secrets..."

if [ ! -f .env ]; then
  cp .env.example .env
  INFLUX_TOKEN=$(openssl rand -hex 32)
  SECRET_KEY=$(openssl rand -hex 64)
  sed -i "s|INFLUXDB_TOKEN=.*|INFLUXDB_TOKEN=$INFLUX_TOKEN|" .env
  sed -i "s|SECRET_KEY_BASE=.*|SECRET_KEY_BASE=$SECRET_KEY|" .env
  # Clear credential placeholders — they are entered via the web UI wizard
  sed -i "s|NA_BASE_URL=.*|NA_BASE_URL=|"   .env
  sed -i "s|NA_USERNAME=.*|NA_USERNAME=|"   .env
  sed -i "s|NA_PASSWORD=.*|NA_PASSWORD=|"   .env
  sed -i "s|NDC_BASE_URL=.*|NDC_BASE_URL=|" .env
  sed -i "s|NDC_USERNAME=.*|NDC_USERNAME=|" .env
  sed -i "s|NDC_PASSWORD=.*|NDC_PASSWORD=|" .env
  ok "Secrets generated — NA/NDC credentials are entered in the web UI on first launch"
fi

# ── SSL ───────────────────────────────────────────────────────────────────────
if [ ! -f ssl/cert.pem ]; then
  warn "No SSL certificate found. Generating self-signed cert..."
  openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout ssl/key.pem -out ssl/cert.pem \
    -subj "/CN=netwrix-intelligence-dashboard/O=NID" 2>/dev/null
  ok "Self-signed cert generated (replace with CA cert for production)"
fi

# ── Pull Ollama model ─────────────────────────────────────────────────────────
info "Pulling Ollama AI model (llama3.2 ~2GB, one-time download)..."
docker compose -f docker-compose.prod.yml pull ollama 2>/dev/null || true

# ── Build and start ───────────────────────────────────────────────────────────
info "Building containers..."
docker compose -f docker-compose.prod.yml build --no-cache

info "Starting services..."
docker compose -f docker-compose.prod.yml up -d

# ── Wait for backend ──────────────────────────────────────────────────────────
info "Waiting for backend to be ready..."
for i in {1..30}; do
  if curl -sf http://localhost/api/health >/dev/null 2>&1; then
    break
  fi
  sleep 3
done

# ── Pull AI model ─────────────────────────────────────────────────────────────
info "Loading AI model into Ollama..."
docker exec nid_ollama ollama pull llama3.2 || warn "Model pull failed — run manually: docker exec nid_ollama ollama pull llama3.2"

# ── Run initial sync ──────────────────────────────────────────────────────────
info "Running initial data sync from Netwrix..."
curl -sf -X POST http://localhost/api/v1/sync/ad         >/dev/null 2>&1 || true
curl -sf -X POST http://localhost/api/v1/sync/fileserver >/dev/null 2>&1 || true

# ── Systemd service ───────────────────────────────────────────────────────────
cat > /etc/systemd/system/netwrix-intelligence-dashboard.service << EOF
[Unit]
Description=Netwrix Intelligence Dashboard
After=docker.service
Requires=docker.service

[Service]
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable netwrix-intelligence-dashboard
ok "Systemd service registered (auto-starts on boot)"

# ── Done ──────────────────────────────────────────────────────────────────────
HOST_IP=$(hostname -I | awk '{print $1}')
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Installation complete!                              ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Dashboard:  https://$HOST_IP                        ║${NC}"
echo -e "${GREEN}║  CEF Port:   TCP 5514 (point Netwrix CEF Add-on here)║${NC}"
echo -e "${GREEN}║  Logs:       docker compose logs -f                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
