#!/bin/bash
set -e  # Exit on error
set -u  # Treat unset variables as errors

echo "=== Checking for Deno ==="
if command -v deno >/dev/null 2>&1; then
  echo "Deno is already installed: $(deno --version)"
else
  echo "Deno not found, installing..."
  curl -fsSL https://deno.land/install.sh | sh

  # Add Deno to PATH for this session
  export DENO_INSTALL="${HOME}/.deno"
  export PATH="${DENO_INSTALL}/bin:${PATH}"

  echo "Deno installed successfully"
fi

echo "=== Checking for Git ==="
if command -v git >/dev/null 2>&1; then
  echo "Git is already installed: $(git --version)"
else
  echo "Git not found, installing..."
  sudo yum install -y git || sudo apt-get install -y git
  echo "Git installed successfully"
fi
