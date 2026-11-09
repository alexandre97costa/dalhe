#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting Local Development Environment (Windows) ===${NC}\n"

# 1. Start the local Supabase containers
echo -e "${BLUE}[1/4] Initializing Supabase...${NC}"
pnpm exec supabase start

# 2. Reset and seed the database
echo -e "\n${BLUE}[2/4] Resetting database...${NC}"
pnpm db:reset

# 3. Spin up the Vite/Dev server in the background
echo -e "\n${BLUE}[3/4] Launching development server...${NC}"
pnpm run dev &
DEV_SERVER_PID=$!

# Give the dev server 3 seconds to spin up before opening browsers
sleep 3

# 4 & 5. Open the target URLs using native Windows execution
echo -e "\n${BLUE}[4/4] Opening local app, Mailpit and Supabase Studio...${NC}"
start "http://localhost:5173/connect/b0000000-0000-4000-8000-000000000002/lounge"
start "http://localhost:54324" # mailpit
start "http://localhost:54323/project/default/database/schemas" # supabase studio

echo -e "${GREEN}✔ Environment is up and running!${NC}"
echo "Press Ctrl+C to stop the development server."

# Keep the script active and bring the background dev server to the foreground
wait $DEV_SERVER_PID
