#!/bin/bash
set -e
set -u

REPO_URL="https://github.com/miniconomy2025/susnet.git"
CLONE_DIR="$HOME/susnet"

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
  sudo yum install -y git || sudo apt-get install -y git
  echo "Git installed successfully"
fi

# --- Clone/Pull Repo ---
if [ ! -d "$CLONE_DIR/.git" ]; then
  git clone "$REPO_URL"
fi

cd $CLONE_DIR
git fetch origin
git checkout stable
git pull origin stable