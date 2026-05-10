#!/bin/bash

# Project details
PROJECT="akubrecah-kra-certificate-portal"

echo "🚀 Starting environment sync for $PROJECT..."

# Read .env file line by line
while IFS='=' read -r key value || [ -n "$key" ]; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue
  
  # Remove potential quotes from value
  value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
  
  echo "Setting $key..."
  # Add to Vercel (Production)
  # We use --force to overwrite existing values if needed
  echo -n "$value" | npx vercel env add "$key" production --force
done < .env

echo "✅ Sync complete! Your Vercel environment is now up to date."
