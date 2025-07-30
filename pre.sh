#!/bin/bash
set -e
set -u

# --- Install Deno System-Wide ---
echo "=== Checking for system-wide Deno ==="
if command -v deno >/dev/null 2>&1; then
  echo "Deno is already installed: $(deno --version)"
else
  echo "Deno not found, installing system-wide..."

  export DENO_INSTALL=/usr/local/deno
  sudo mkdir -p "$DENO_INSTALL"
  sudo chown $USER:$USER "$DENO_INSTALL"

  curl -fsSL https://deno.land/install.sh | DENO_INSTALL=$DENO_INSTALL sh

  # Add to system-wide PATH if not already present
  if [ ! -f /etc/profile.d/deno.sh ]; then
    echo 'export DENO_INSTALL="/usr/local/deno"' | sudo tee /etc/profile.d/deno.sh > /dev/null
    echo 'export PATH="$DENO_INSTALL/bin:$PATH"' | sudo tee -a /etc/profile.d/deno.sh > /dev/null
    sudo chmod +x /etc/profile.d/deno.sh
    echo "Added Deno to global PATH via /etc/profile.d/deno.sh"
  fi

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
