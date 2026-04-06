#!/usr/bin/env bash
set -euo pipefail

echo "Building and starting frontend, backend, and database containers..."
docker compose up --build -d

echo "Services are up."
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000/docs"

