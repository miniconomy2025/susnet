#!/bin/bash
set -e
set -u

# --- Install Deno Permanently ---
echo "=== Checking for Deno ==="
if command -v deno >/dev/null 2>&1; then
  echo "Deno is already installed: $(deno --version)"
else
  echo "Deno not found, installing..."

  # Install Deno to the current user's home
  curl -fsSL https://deno.land/install.sh | sh

  # Add Deno to PATH permanently by modifying ~/.bashrc (or ~/.profile if bashrc not sourced)
  DENO_PROFILE_UPDATE='export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"'

  if ! grep -q "DENO_INSTALL" ~/.bashrc; then
    echo "$DENO_PROFILE_UPDATE" >> ~/.bashrc
    echo "Appended Deno PATH export to ~/.bashrc"
  fi

  if ! grep -q "DENO_INSTALL" ~/.profile; then
    echo "$DENO_PROFILE_UPDATE" >> ~/.profile
    echo "Appended Deno PATH export to ~/.profile"
  fi

  echo "Deno installed successfully"
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
