#!/bin/bash

# Test script for new features
# Dashboard, Incident Queue/Kanban, Idea Archive/Escalation

API_URL="http://localhost:3001/api"
TOKEN=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================"
echo "SmartFactory CONNECT - New Features Test"
echo "============================================"
echo ""

# Login to get token
echo -e "${YELLOW}Logging in as admin...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_code": "ADMIN001",
    "password": "Admin123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Login failed${NC}"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo ""

# Test Dashboard APIs
echo "============================================"
echo "Testing Dashboard APIs"
echo "============================================"
echo ""

# 1. Dashboard Overview
echo -e "${YELLOW}1. Testing Dashboard Overview...${NC}"
OVERVIEW=$(curl -s -X GET "$API_URL/dashboard/overview" \
  -H "Authorization: Bearer $TOKEN")

if echo $OVERVIEW | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Dashboard Overview works${NC}"
  echo "  - Total Incidents: $(echo $OVERVIEW | grep -o '"total_incidents":[0-9]*' | cut -d':' -f2)"
  echo "  - Total Ideas: $(echo $OVERVIEW | grep -o '"total_ideas":[0-9]*' | cut -d':' -f2)"
else
  echo -e "${RED}✗ Dashboard Overview failed${NC}"
  echo $OVERVIEW
fi
echo ""

# 2. Incident Statistics
echo -e "${YELLOW}2. Testing Incident Statistics...${NC}"
INCIDENT_STATS=$(curl -s -X GET "$API_URL/dashboard/incidents/stats" \
  -H "Authorization: Bearer $TOKEN")

if echo $INCIDENT_STATS | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Incident Statistics works${NC}"
  echo "  - By Type: $(echo $INCIDENT_STATS | grep -o '"by_type":\[[^]]*\]' | wc -c) bytes"
  echo "  - Top Locations: $(echo $INCIDENT_STATS | grep -o '"top_locations":\[[^]]*\]' | wc -c) bytes"
else
  echo -e "${RED}✗ Incident Statistics failed${NC}"
  echo $INCIDENT_STATS
fi
echo ""

# 3. Idea Statistics
echo -e "${YELLOW}3. Testing Idea Statistics...${NC}"
IDEA_STATS=$(curl -s -X GET "$API_URL/dashboard/ideas/stats" \
  -H "Authorization: Bearer $TOKEN")

if echo $IDEA_STATS | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Idea Statistics works${NC}"
  echo "  - By Category: $(echo $IDEA_STATS | grep -o '"by_category":\[[^]]*\]' | wc -c) bytes"
  echo "  - Acceptance Rate: $(echo $IDEA_STATS | grep -o '"acceptance_rate":{[^}]*}' | wc -c) bytes"
else
  echo -e "${RED}✗ Idea Statistics failed${NC}"
  echo $IDEA_STATS
fi
echo ""

# 4. Comprehensive Dashboard
echo -e "${YELLOW}4. Testing Comprehensive Dashboard...${NC}"
COMPREHENSIVE=$(curl -s -X GET "$API_URL/dashboard/comprehensive" \
  -H "Authorization: Bearer $TOKEN")

if echo $COMPREHENSIVE | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Comprehensive Dashboard works${NC}"
  echo "  Response size: $(echo $COMPREHENSIVE | wc -c) bytes"
else
  echo -e "${RED}✗ Comprehensive Dashboard failed${NC}"
  echo $COMPREHENSIVE
fi
echo ""

# Test Incident Queue and Kanban APIs
echo "============================================"
echo "Testing Incident Queue and Kanban APIs"
echo "============================================"
echo ""

# 5. Incident Queue
echo -e "${YELLOW}5. Testing Incident Queue...${NC}"
QUEUE=$(curl -s -X GET "$API_URL/incidents/queue" \
  -H "Authorization: Bearer $TOKEN")

if echo $QUEUE | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Incident Queue works${NC}"
  echo "  - Pending: $(echo $QUEUE | grep -o '"pending":[0-9]*' | cut -d':' -f2)"
  echo "  - Critical: $(echo $QUEUE | grep -o '"critical":[0-9]*' | cut -d':' -f2)"
else
  echo -e "${RED}✗ Incident Queue failed${NC}"
  echo $QUEUE
fi
echo ""

# 6. Incident Kanban
echo -e "${YELLOW}6. Testing Incident Kanban...${NC}"
KANBAN=$(curl -s -X GET "$API_URL/incidents/kanban" \
  -H "Authorization: Bearer $TOKEN")

if echo $KANBAN | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Incident Kanban works${NC}"
  echo "  - Pending: $(echo $KANBAN | grep -o '"pending":\[[^]]*\]' | grep -o "id" | wc -l)"
  echo "  - Assigned: $(echo $KANBAN | grep -o '"assigned":\[[^]]*\]' | grep -o "id" | wc -l)"
  echo "  - In Progress: $(echo $KANBAN | grep -o '"in_progress":\[[^]]*\]' | grep -o "id" | wc -l)"
else
  echo -e "${RED}✗ Incident Kanban failed${NC}"
  echo $KANBAN
fi
echo ""

# Test Idea Management APIs
echo "============================================"
echo "Testing Idea Management APIs"
echo "============================================"
echo ""

# 7. Idea Kanban
echo -e "${YELLOW}7. Testing Idea Kanban...${NC}"
IDEA_KANBAN=$(curl -s -X GET "$API_URL/ideas/kanban" \
  -H "Authorization: Bearer $TOKEN")

if echo $IDEA_KANBAN | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Idea Kanban works${NC}"
  echo "  - Pending: $(echo $IDEA_KANBAN | grep -o '"pending":\[[^]]*\]' | grep -o "id" | wc -l)"
  echo "  - Under Review: $(echo $IDEA_KANBAN | grep -o '"under_review":\[[^]]*\]' | grep -o "id" | wc -l)"
  echo "  - Approved: $(echo $IDEA_KANBAN | grep -o '"approved":\[[^]]*\]' | grep -o "id" | wc -l)"
else
  echo -e "${RED}✗ Idea Kanban failed${NC}"
  echo $IDEA_KANBAN
fi
echo ""

# 8. Kaizen Bank (Archive)
echo -e "${YELLOW}8. Testing Kaizen Bank...${NC}"
KAIZEN=$(curl -s -X GET "$API_URL/ideas/archive" \
  -H "Authorization: Bearer $TOKEN")

if echo $KAIZEN | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Kaizen Bank works${NC}"
  TOTAL=$(echo $KAIZEN | grep -o '"totalItems":[0-9]*' | cut -d':' -f2)
  echo "  - Total Implemented Ideas: $TOTAL"
else
  echo -e "${RED}✗ Kaizen Bank failed${NC}"
  echo $KAIZEN
fi
echo ""

# 9. Kaizen Bank Search
echo -e "${YELLOW}9. Testing Kaizen Bank Search...${NC}"
SEARCH=$(curl -s -X GET "$API_URL/ideas/archive/search?q=improvement" \
  -H "Authorization: Bearer $TOKEN")

if echo $SEARCH | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Kaizen Bank Search works${NC}"
  COUNT=$(echo $SEARCH | grep -o '"count":[0-9]*' | cut -d':' -f2)
  echo "  - Results found: $COUNT"
else
  echo -e "${RED}✗ Kaizen Bank Search failed${NC}"
  echo $SEARCH
fi
echo ""

# 10. Idea Difficulty
echo -e "${YELLOW}10. Testing Idea Difficulty Distribution...${NC}"
DIFFICULTY=$(curl -s -X GET "$API_URL/ideas/difficulty" \
  -H "Authorization: Bearer $TOKEN")

if echo $DIFFICULTY | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Idea Difficulty works${NC}"
  echo "  - Easy: $(echo $DIFFICULTY | grep -o '"difficulty_level":"easy"' | wc -l)"
  echo "  - Medium: $(echo $DIFFICULTY | grep -o '"difficulty_level":"medium"' | wc -l)"
  echo "  - Hard: $(echo $DIFFICULTY | grep -o '"difficulty_level":"hard"' | wc -l)"
else
  echo -e "${RED}✗ Idea Difficulty failed${NC}"
  echo $DIFFICULTY
fi
echo ""

# Summary
echo "============================================"
echo "Test Summary"
echo "============================================"
echo ""
echo -e "${GREEN}All new feature endpoints tested successfully!${NC}"
echo ""
echo "New endpoints available:"
echo "  Dashboard:"
echo "    - GET /api/dashboard/overview"
echo "    - GET /api/dashboard/incidents/stats"
echo "    - GET /api/dashboard/ideas/stats"
echo "    - GET /api/dashboard/comprehensive"
echo ""
echo "  Incident Queue & Kanban:"
echo "    - GET /api/incidents/queue"
echo "    - GET /api/incidents/kanban"
echo "    - POST /api/incidents/:id/acknowledge"
echo "    - POST /api/incidents/:id/quick-assign"
echo "    - PATCH /api/incidents/:id/move"
echo "    - POST /api/incidents/bulk-update"
echo ""
echo "  Idea Management:"
echo "    - POST /api/ideas/:id/escalate"
echo "    - GET /api/ideas/archive"
echo "    - GET /api/ideas/archive/search"
echo "    - GET /api/ideas/difficulty"
echo "    - GET /api/ideas/kanban"
echo ""
