#!/bin/bash
set -e
set -u

REPO_URL="https://github.com/miniconomy2025/susnet.git"
CLONE_DIR="/home/ec2-user/susnet"

# --- Install Deno System-Wide ---
echo "=== Checking for system-wide Deno ==="
if command -v deno >/dev/null 2>&1; then
  echo "Deno is already installed: $(deno --version)"
else
  echo "Deno not found, installing system-wide..."

  export DENO_INSTALL=/usr
  sudo mkdir -p "$DENO_INSTALL"
  sudo chown $USER:$USER "$DENO_INSTALL"

  curl -fsSL https://deno.land/install.sh | sudo DENO_INSTALL=$DENO_INSTALL sh

  echo "Deno installed successfully system-wide"
fi

# --- Install Git ---
echo "=== Checking for Git ==="
if command -v git >/dev/null 2>&1; then
  echo "Git is already installed: $(git --version)"
else
  echo "Git not found, installing..."
  sudo yum install -y git
  echo "Git installed successfully"
fi

# --- Clone/Pull Repo ---
if [ -d "$CLONE_DIR/.git" ]; then
  echo "Repo already cloned, pulling latest changes..."
  cd "$CLONE_DIR"
  git restore .
  git fetch origin
  git checkout stable
  git pull origin stable
else
  echo "Cloning repo..."
  git clone --branch stable "$REPO_URL" "$CLONE_DIR"
  git config --global --add safe.directory "$CLONE_DIR"
fi
cd "$CLONE_DIR"
sudo env "PATH=$PATH" pm2 start
sudo env "PATH=$PATH" pm2 restart all