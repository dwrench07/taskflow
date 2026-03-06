#!/bin/bash
set -e

# Start the Next.js server in the background
npm start &
SERVER_PID=$!

# Wait for server to boot
echo "Waiting for dev server to start..."
sleep 10

echo "Registering User A"
curl -s -X POST -H "Content-Type: application/json" -c cookies_a.txt \
  -d '{"name": "Alice", "email": "alice@test.com", "password": "password123"}' \
  http://localhost:3000/api/auth/register

echo -e "\n\nRegistering User B"
curl -s -X POST -H "Content-Type: application/json" -c cookies_b.txt \
  -d '{"name": "Bob", "email": "bob@test.com", "password": "password123"}' \
  http://localhost:3000/api/auth/register

echo -e "\n\nUser A Creates a Task"
curl -s -X POST -H "Content-Type: application/json" -b cookies_a.txt \
  -d '{"title": "Alice Task", "description": "Alice Top Secret", "priority": "high", "status": "todo"}' \
  http://localhost:3000/api/tasks

echo -e "\n\nUser B Gets their Tasks (Should be empty!)"
curl -s -X GET -b cookies_b.txt http://localhost:3000/api/tasks

echo -e "\n\nUser A Gets their Tasks (Should have 1 task!)"
curl -s -X GET -b cookies_a.txt http://localhost:3000/api/tasks

# Kill the server
kill $SERVER_PID
