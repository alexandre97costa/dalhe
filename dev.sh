#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting Local Development Environment (Windows) ===${NC}\n"

# 1. Start the local Supabase containers
echo -e "${BLUE}[1/5] Initializing Supabase...${NC}"
pnpm exec supabase start

# 2. Reset and seed the database
echo -e "\n${BLUE}[2/5] Resetting database...${NC}"
pnpm db:reset

# 3. Spin up the Vite/Dev server in the background
echo -e "\n${BLUE}[3/5] Launching development server...${NC}"
pnpm run dev &
DEV_SERVER_PID=$!

# Give the dev server 3 seconds to spin up before opening browsers
sleep 10

# 4 & 5. Open the target URLs using native Windows execution
echo -e "\n${BLUE}[4/5] Opening local application and Supabase studio...${NC}"
start "http://localhost:5173/login"
start "http://127.0.0.1:54324"

# 6. Output the explicit test link
echo -e "\n${BLUE}[5/5] Deep link for testing:${NC}"
echo -e "${GREEN}http://localhost:5173/connect/b0000000-0000-4000-8000-000000000002/lounge${NC}\n"

echo -e "${GREEN}✔ Environment is up and running!${NC}"
echo "Press Ctrl+C to stop the development server."

# Keep the script active and bring the background dev server to the foreground
wait $DEV_SERVER_PID
