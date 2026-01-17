#!/bin/bash

# ===========================================
# SmartFactory CONNECT Web - Git Push Script
# ===========================================

set -e

cd "/Users/vudangkhoa/Working/SmartFactory CONNECT/SmartFactory_CONNECT_Web"

echo "🌐 SmartFactory CONNECT Web - Git Push"
echo "========================================"

# Remove old git and initialize fresh
rm -rf .git
git init
git checkout -b main

COMMIT_COUNT=0

do_commit() {
    local files="$1"
    local message="$2"
    git add $files 2>/dev/null || true
    if ! git diff --cached --quiet 2>/dev/null; then
        git commit -m "$message" 2>/dev/null || true
        COMMIT_COUNT=$((COMMIT_COUNT + 1))
        echo "[$COMMIT_COUNT] $message"
    fi
}

echo ""
echo "📦 Creating commits..."
echo ""

# === Project Setup (5 commits) ===
do_commit ".gitignore" "chore: add gitignore"
do_commit ".env.example" "chore: add env template"
do_commit "LICENSE" "docs: add license"
do_commit "README.md" "docs: add README"
do_commit "DOCKER_DEPLOYMENT.md" "docs: add Docker guide"

# === Backend - Config (5 commits) ===
do_commit "backend/package*.json" "chore(backend): init Node.js project"
do_commit "backend/index.js" "feat(backend): add server entry"
do_commit "backend/Dockerfile" "chore(backend): add Dockerfile"
do_commit "backend/README.md" "docs(backend): add documentation"
do_commit "backend/src/config/" "feat(backend): add configurations"

# === Backend - Models (8 commits) ===
do_commit "backend/src/models/User.js" "feat(backend): add User model"
do_commit "backend/src/models/Department.js" "feat(backend): add Department model"
do_commit "backend/src/models/Idea.js" "feat(backend): add Idea model"
do_commit "backend/src/models/Incident.js" "feat(backend): add Incident model"
do_commit "backend/src/models/News.js" "feat(backend): add News model"
do_commit "backend/src/models/Room.js" "feat(backend): add Room model"
do_commit "backend/src/models/Booking.js" "feat(backend): add Booking model"
do_commit "backend/src/models/" "feat(backend): complete models"

# === Backend - Middleware (3 commits) ===
do_commit "backend/src/middleware/auth.js" "feat(backend): add auth middleware"
do_commit "backend/src/middleware/upload.js" "feat(backend): add file upload"
do_commit "backend/src/middleware/" "feat(backend): complete middleware"

# === Backend - Routes (10 commits) ===
do_commit "backend/src/routes/authRoutes.js" "feat(backend): add auth API"
do_commit "backend/src/routes/userRoutes.js" "feat(backend): add users API"
do_commit "backend/src/routes/ideaRoutes.js" "feat(backend): add ideas API"
do_commit "backend/src/routes/incidentRoutes.js" "feat(backend): add incidents API"
do_commit "backend/src/routes/newsRoutes.js" "feat(backend): add news API"
do_commit "backend/src/routes/roomRoutes.js" "feat(backend): add rooms API"
do_commit "backend/src/routes/bookingRoutes.js" "feat(backend): add booking API"
do_commit "backend/src/routes/departmentRoutes.js" "feat(backend): add departments API"
do_commit "backend/src/routes/kaizenRoutes.js" "feat(backend): add kaizen API"
do_commit "backend/src/routes/" "feat(backend): complete routes"

# === Backend - Services & Utils (4 commits) ===
do_commit "backend/src/services/" "feat(backend): add services"
do_commit "backend/src/utils/" "feat(backend): add utilities"
do_commit "backend/src/socket/" "feat(backend): add WebSocket"
do_commit "backend/src/" "feat(backend): complete source"

# === Backend - Scripts & Data (3 commits) ===
do_commit "backend/scripts/" "feat(backend): add scripts"
do_commit "backend/data-exports/" "chore(backend): add seed data"
do_commit "backend/" "feat(backend): complete backend"

# === Frontend - Setup (5 commits) ===
do_commit "frontend/package*.json" "chore(frontend): init React project"
do_commit "frontend/vite.config.ts" "chore(frontend): configure Vite"
do_commit "frontend/tailwind.config.js" "chore(frontend): configure Tailwind"
do_commit "frontend/tsconfig*.json" "chore(frontend): configure TypeScript"
do_commit "frontend/Dockerfile" "chore(frontend): add Dockerfile"

# === Frontend - Core (5 commits) ===
do_commit "frontend/src/contexts/" "feat(frontend): add contexts"
do_commit "frontend/src/hooks/" "feat(frontend): add hooks"
do_commit "frontend/src/services/" "feat(frontend): add API services"
do_commit "frontend/src/types/" "feat(frontend): add TypeScript types"
do_commit "frontend/src/utils/" "feat(frontend): add utilities"

# === Frontend - Components (8 commits) ===
do_commit "frontend/src/components/common/" "feat(frontend): add common components"
do_commit "frontend/src/components/auth/" "feat(frontend): add auth components"
do_commit "frontend/src/components/dashboard/" "feat(frontend): add dashboard widgets"
do_commit "frontend/src/components/feedback/" "feat(frontend): add feedback components"
do_commit "frontend/src/components/header/" "feat(frontend): add header"
do_commit "frontend/src/components/ChatAssistant/" "feat(frontend): add AI assistant"
do_commit "frontend/src/components/MediaViewer/" "feat(frontend): add media viewer"
do_commit "frontend/src/components/" "feat(frontend): complete components"

# === Frontend - Pages (6 commits) ===
do_commit "frontend/src/pages/Dashboard/" "feat(frontend): add dashboard pages"
do_commit "frontend/src/pages/feedback/" "feat(frontend): add feedback pages"
do_commit "frontend/src/pages/Admin/" "feat(frontend): add admin pages"
do_commit "frontend/src/pages/Login*" "feat(frontend): add login page"
do_commit "frontend/src/pages/" "feat(frontend): complete pages"
do_commit "frontend/src/" "feat(frontend): complete source"

# === Frontend - Assets (2 commits) ===
do_commit "frontend/public/" "chore(frontend): add assets"
do_commit "frontend/" "feat(frontend): complete frontend"

# === RAG Service (4 commits) ===
do_commit "rag_service/requirements.txt" "chore(rag): add dependencies"
do_commit "rag_service/main.py" "feat(rag): add FastAPI server"
do_commit "rag_service/Dockerfile" "chore(rag): add Dockerfile"
do_commit "rag_service/" "feat(rag): complete RAG service"

# === DevOps (3 commits) ===
do_commit "docker-compose.yml" "chore(devops): add Docker Compose"
do_commit "scripts/" "chore(devops): add scripts"
do_commit "docs/" "docs: add documentation"

# === Final ===
git add -A
if ! git diff --cached --quiet 2>/dev/null; then
    git commit -m "chore: final cleanup"
    COMMIT_COUNT=$((COMMIT_COUNT + 1))
    echo "[$COMMIT_COUNT] chore: final cleanup"
fi

echo ""
echo "=========================================="
echo "📊 Total commits: $COMMIT_COUNT"
echo "=========================================="
echo ""
git log --oneline | head -20
echo ""
echo "📤 To push to GitHub:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/SmartFactory-CONNECT-Web.git"
echo "   git push -u origin main"
