#!/bin/bash
# ============================================
# ScaleBiz - Frontend Dev Server
# ============================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    exit 0
}
trap cleanup INT TERM

echo "🚀 Starting ScaleBiz Frontend..."

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Install it via: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Kill stale processes on frontend ports
for port in 3005 42069 42070; do
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

echo ""
echo "▶️  Running: bun run dev:frontend (port 3005)"
echo "   Tunnel: https://local-fe.scalebiz.chat → :3005"
echo "   (tunnel runs via run-backend.sh)"
echo "   HMR over tunnel: optional (set ENABLE_TUNNEL_HMR=true if needed)"
echo "-------------------------------------------"

cd "$SCRIPT_DIR"
# Default OFF to prevent browser auto-refresh loops on tunnel instability.
export ENABLE_TUNNEL_HMR="${ENABLE_TUNNEL_HMR:-false}"
export TUNNEL_FE_HOST="${TUNNEL_FE_HOST:-local-fe.scalebiz.chat}"
bun run dev:frontend
