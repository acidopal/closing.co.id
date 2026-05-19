#!/bin/bash
# ============================================
# ScaleBiz - Backend Dev Server + Tunnel
# ============================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TUNNEL_PID=""
BUN_PID=""

# Read env vars
read_env_var() {
    local key="$1"
    local env_file="$SCRIPT_DIR/.env"
    [ ! -f "$env_file" ] && return 0
    awk -F= -v key="$key" '
        $1 == key { val = substr($0, index($0, "=") + 1); found = val }
        END { if (found != "") print found }
    ' "$env_file"
}

CLOUDFLARED_TUNNEL_TOKEN="${CLOUDFLARED_TUNNEL_TOKEN:-$(read_env_var "CLOUDFLARED_TUNNEL_TOKEN")}"
TUNNEL_API_HOST="${TUNNEL_API_HOST:-$(read_env_var "TUNNEL_API_HOST")}"
TUNNEL_API_HOST="${TUNNEL_API_HOST:-local-api.scalebiz.chat}"

cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    [ -n "$BUN_PID" ] && kill "$BUN_PID" 2>/dev/null && wait "$BUN_PID" 2>/dev/null
    [ -n "$TUNNEL_PID" ] && kill "$TUNNEL_PID" 2>/dev/null && wait "$TUNNEL_PID" 2>/dev/null
    exit 0
}
trap cleanup INT TERM

echo "🚀 Starting ScaleBiz Backend..."

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Install it via: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Kill stale processes on backend ports
for port in 3010 3011; do
    pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        echo "🧹 Killing stale process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
    fi
done

# Install deps if needed
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd "$SCRIPT_DIR" && bun install
fi

# Start Cloudflared tunnel
if command -v cloudflared &>/dev/null && [ -n "$CLOUDFLARED_TUNNEL_TOKEN" ]; then
    mkdir -p "$SCRIPT_DIR/.collaborator"
    TUNNEL_LOG="$SCRIPT_DIR/.collaborator/cloudflared-backend.log"
    echo "☁️  Tunnel: https://$TUNNEL_API_HOST → :3010"
    cloudflared tunnel run --token "$CLOUDFLARED_TUNNEL_TOKEN" >"$TUNNEL_LOG" 2>&1 &
    TUNNEL_PID=$!
    sleep 2
    if kill -0 "$TUNNEL_PID" 2>/dev/null; then
        echo "✅ Tunnel running (PID: $TUNNEL_PID)"
    else
        echo "⚠️  Tunnel failed to start. Check: $TUNNEL_LOG"
        TUNNEL_PID=""
    fi
else
    echo "⚠️  Skipping tunnel (cloudflared not found or CLOUDFLARED_TUNNEL_TOKEN not set)"
fi

echo ""
echo "▶️  Running: bun run dev:backend"
echo "-------------------------------------------"

cd "$SCRIPT_DIR"
bun run dev:backend &
BUN_PID=$!
wait $BUN_PID
