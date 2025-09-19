#!/bin/bash

# Script to create PocketBase collections using direct HTTP API calls

echo "🔧 Creating PocketBase Collections via HTTP API..."

PB_URL="http://127.0.0.1:8090"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASS="adminpass123"

# Step 1: Authenticate as admin
echo "1. Authenticating admin..."
AUTH_RESPONSE=$(curl -s -X POST "$PB_URL/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")

TOKEN=$(echo $AUTH_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to authenticate admin"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

echo "✅ Admin authenticated"

# Step 2: Create recipes collection
echo "2. Creating recipes collection..."
RECIPES_RESPONSE=$(curl -s -X POST "$PB_URL/api/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "recipes",
    "type": "base",
    "schema": [
      {
        "name": "name",
        "type": "text",
        "required": true,
        "options": {
          "min": 1,
          "max": 100
        }
      },
      {
        "name": "total_time",
        "type": "number",
        "required": true,
        "options": {
          "min": 5,
          "max": 300,
          "noDecimal": true
        }
      },
      {
        "name": "servings",
        "type": "number",
        "required": true,
        "options": {
          "min": 1,
          "max": 20,
          "noDecimal": true
        }
      }
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": ""
  }')

echo "Recipes response: $RECIPES_RESPONSE"

# Step 3: Create cooking_sessions collection
echo "3. Creating cooking_sessions collection..."
SESSIONS_RESPONSE=$(curl -s -X POST "$PB_URL/api/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cooking_sessions",
    "type": "base",
    "schema": [
      {
        "name": "date",
        "type": "date",
        "required": true
      },
      {
        "name": "duration_minutes",
        "type": "number",
        "required": true,
        "options": {
          "min": 30,
          "max": 360,
          "noDecimal": true
        }
      },
      {
        "name": "status",
        "type": "select",
        "required": true,
        "options": {
          "maxSelect": 1,
          "values": ["planned", "in_progress", "completed"]
        }
      }
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": ""
  }')

echo "Sessions response: $SESSIONS_RESPONSE"

# Get collection IDs for relations
RECIPES_ID=$(echo $RECIPES_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
SESSIONS_ID=$(echo $SESSIONS_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

echo "Recipes ID: $RECIPES_ID"
echo "Sessions ID: $SESSIONS_ID"

# Step 4: Create cooking_tasks collection
echo "4. Creating cooking_tasks collection..."
TASKS_RESPONSE=$(curl -s -X POST "$PB_URL/api/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"cooking_tasks\",
    \"type\": \"base\",
    \"schema\": [
      {
        \"name\": \"session_id\",
        \"type\": \"relation\",
        \"required\": true,
        \"options\": {
          \"collectionId\": \"$SESSIONS_ID\",
          \"cascadeDelete\": true,
          \"minSelect\": null,
          \"maxSelect\": 1,
          \"displayFields\": null
        }
      },
      {
        \"name\": \"recipe_id\",
        \"type\": \"relation\",
        \"required\": true,
        \"options\": {
          \"collectionId\": \"$RECIPES_ID\",
          \"cascadeDelete\": false,
          \"minSelect\": null,
          \"maxSelect\": 1,
          \"displayFields\": null
        }
      },
      {
        \"name\": \"task_name\",
        \"type\": \"text\",
        \"required\": true,
        \"options\": {
          \"min\": 1,
          \"max\": 100
        }
      },
      {
        \"name\": \"duration_minutes\",
        \"type\": \"number\",
        \"required\": true,
        \"options\": {
          \"min\": 1,
          \"max\": 180,
          \"noDecimal\": true
        }
      },
      {
        \"name\": \"appliance\",
        \"type\": \"select\",
        \"required\": true,
        \"options\": {
          \"maxSelect\": 1,
          \"values\": [\"oven\", \"stovetop_1\", \"stovetop_2\", \"microwave\", \"counter\", \"fridge\"]
        }
      },
      {
        \"name\": \"start_time\",
        \"type\": \"number\",
        \"required\": false,
        \"options\": {
          \"min\": 0,
          \"max\": 1440,
          \"noDecimal\": true
        }
      },
      {
        \"name\": \"order_priority\",
        \"type\": \"number\",
        \"required\": true,
        \"options\": {
          \"min\": 1,
          \"max\": 99,
          \"noDecimal\": true
        }
      },
      {
        \"name\": \"can_parallel\",
        \"type\": \"bool\",
        \"required\": false
      }
    ],
    \"listRule\": \"\",
    \"viewRule\": \"\",
    \"createRule\": \"\",
    \"updateRule\": \"\",
    \"deleteRule\": \"\"
  }")

echo "Tasks response: $TASKS_RESPONSE"

echo ""
echo "✅ Collection creation completed!"

# Step 5: Test by creating sample data
echo "5. Testing collections with sample data..."

# Create a test recipe
echo "Creating test recipe..."
TEST_RECIPE=$(curl -s -X POST "$PB_URL/api/collections/recipes/records" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Chicken",
    "total_time": 90,
    "servings": 4
  }')

echo "Test recipe: $TEST_RECIPE"

# Create a test session
echo "Creating test session..."
TEST_SESSION=$(curl -s -X POST "$PB_URL/api/collections/cooking_sessions/records" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"$(date +%Y-%m-%d)\",
    \"duration_minutes\": 180,
    \"status\": \"planned\"
  }")

echo "Test session: $TEST_SESSION"

echo ""
echo "🎉 Setup complete! Collections should now work with the UI."
echo "Test at: http://localhost:5173/"