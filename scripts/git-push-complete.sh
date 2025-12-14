#!/bin/bash

# Professional Git Commit & Push Script
# SmartFactory CONNECT - Complete Implementation
# Date: December 14, 2025

set -e

cd "$(dirname "$0")/.."

echo "🚀 SmartFactory CONNECT - Git Push Script"
echo "=========================================="
echo ""

# ============= Backend Infrastructure =============
echo "📦 Backend Infrastructure..."

git add backend/index.js
git commit -m "feat(backend): integrate MongoDB with PostgreSQL dual database" || true

git add backend/package.json backend/package-lock.json
git commit -m "build(backend): add mongodb@^6.3.0 and update dependencies" || true

git add backend/.env.example
git commit -m "config(backend): add MongoDB connection environment variables" || true

git add backend/.gitignore
git commit -m "chore(backend): update gitignore for uploads and logs" || true

git add backend/README.md
git commit -m "docs(backend): update README with MongoDB integration" || true

# ============= Backend Configuration =============
echo "⚙️  Backend Configuration..."

git add backend/src/config/database.js
git commit -m "refactor(config): optimize PostgreSQL connection pooling" || true

git add backend/src/config/socket.js
git commit -m "refactor(config): enhance Socket.io configuration" || true

git add backend/src/config/mongodb.js
git commit -m "feat(config): implement MongoDB GridFS connection manager" || true

# ============= Backend Services =============
echo "🔧 Backend Services..."

git add backend/src/services/media-storage.service.js
git commit -m "feat(services): create GridFS media storage service" || true

git add backend/src/services/cache.service.js
git commit -m "refactor(services): optimize cache service" || true

git add backend/src/services/escalation.service.js
git commit -m "refactor(services): enhance incident escalation logic" || true

git add backend/src/services/notification.service.js
git commit -m "refactor(services): improve notification service" || true

git add backend/src/services/rating.service.js
git commit -m "refactor(services): update rating service" || true

git add backend/src/services/translation.service.js
git commit -m "refactor(services): enhance translation service" || true

# ============= Backend Controllers =============
echo "🎮 Backend Controllers..."

git add backend/src/controllers/auth.controller.js
git commit -m "refactor(controllers): improve auth controller error handling" || true

git add backend/src/controllers/dashboard.controller.js
git commit -m "refactor(controllers): optimize dashboard data queries" || true

git add backend/src/controllers/idea.controller.js
git commit -m "refactor(controllers): enhance idea controller with better validation" || true

git add backend/src/controllers/incident.controller.js
git commit -m "refactor(controllers): improve incident controller logic" || true

git add backend/src/controllers/notification.controller.js
git commit -m "refactor(controllers): optimize notification controller" || true

git add backend/src/controllers/user.controller.js
git commit -m "refactor(controllers): enhance user controller security" || true

# ============= Backend Routes =============
echo "🛣️  Backend Routes..."

git add backend/src/routes/*.js
git commit -m "refactor(routes): update all API routes with better middleware" || true

# ============= Backend Middlewares =============
echo "🛡️  Backend Middlewares..."

git add backend/src/middlewares/*.js
git commit -m "refactor(middlewares): enhance validation and auth middlewares" || true

# ============= Backend Database Cleanup =============
echo "🗄️  Database Cleanup..."

git add backend/src/database/schema_complete.sql
git commit -m "docs(database): update complete PostgreSQL schema" || true

git add backend/src/database/migrations/
git commit -m "feat(database): add new migration files" || true

# Remove deleted files
git add -u backend/src/database/
git commit -m "chore(database): remove obsolete migration files" || true

git add -u backend/scripts/
git commit -m "chore(scripts): remove deprecated backend scripts" || true

# ============= Docker Configuration =============
echo "🐳 Docker Configuration..."

git add docker-compose.yml
git commit -m "feat(docker): add MongoDB 7.0 with GridFS to compose" || true

# ============= Frontend i18n System =============
echo "🌐 Frontend Internationalization..."

git add frontend/src/i18n/locales/vi.json
git commit -m "feat(i18n): complete Vietnamese translations (400+ keys)" || true

git add frontend/src/i18n/locales/ja.json
git commit -m "feat(i18n): complete Japanese translations (400+ keys)" || true

git add frontend/src/i18n/locales/en.json
git commit -m "feat(i18n): update English translation keys" || true

# ============= Frontend Context Architecture =============
echo "📋 Frontend Context..."

git add frontend/src/contexts/AuthContext.tsx
git commit -m "refactor(contexts): update AuthContext with better typing" || true

git add frontend/src/contexts/LanguageContext.tsx
git commit -m "refactor(contexts): enhance LanguageContext for multi-language" || true

git add frontend/src/contexts/SidebarContext.tsx
git commit -m "refactor(contexts): consolidate SidebarContext from context folder" || true

git add frontend/src/contexts/ThemeContext.tsx
git commit -m "refactor(contexts): consolidate ThemeContext from context folder" || true

# ============= Frontend Layout Components =============
echo "🏗️  Frontend Layout..."

git add frontend/src/layout/AppLayout.tsx
git commit -m "refactor(layout): update AppLayout with fixed context imports" || true

git add frontend/src/layout/Backdrop.tsx
git commit -m "refactor(layout): update Backdrop context import path" || true

git add frontend/src/layout/AppHeader.tsx
git commit -m "refactor(layout): fix AppHeader context imports" || true

git add frontend/src/layout/AppSidebar.tsx
git commit -m "refactor(layout): update AppSidebar with correct imports" || true

# ============= Frontend Main Entry =============
echo "🚪 Frontend Entry Point..."

git add frontend/src/main.tsx
git commit -m "refactor(main): fix context provider imports in main.tsx" || true

git add frontend/src/App.tsx
git commit -m "refactor(app): update App.tsx configuration" || true

# ============= Frontend Pages - User Management =============
echo "👥 User Management Pages..."

git add frontend/src/pages/UserList.tsx
git commit -m "feat(pages): implement i18n in UserList page" || true

git add frontend/src/pages/UserProfiles.tsx
git commit -m "feat(pages): implement i18n in UserProfiles page" || true

git add frontend/src/pages/AddUser.tsx
git commit -m "feat(pages): add Vietnamese/Japanese support to AddUser" || true

git add frontend/src/pages/EditUser.tsx
git commit -m "feat(pages): add Vietnamese/Japanese support to EditUser" || true

# ============= Frontend Pages - Department =============
echo "🏢 Department Pages..."

git add frontend/src/pages/DepartmentList.tsx
git commit -m "feat(pages): implement i18n in DepartmentList page" || true

git add frontend/src/pages/AddDepartment.tsx
git commit -m "feat(pages): add multi-language support to AddDepartment" || true

git add frontend/src/pages/EditDepartment.tsx
git commit -m "feat(pages): add multi-language support to EditDepartment" || true

# ============= Frontend Pages - Calendar =============
echo "📅 Calendar & Booking Pages..."

git add frontend/src/pages/Calendar.tsx
git commit -m "feat(pages): implement i18n in Calendar component" || true

git add frontend/src/pages/CreateBooking.tsx
git commit -m "feat(pages): add Vietnamese/Japanese to CreateBooking" || true

git add frontend/src/pages/EditBooking.tsx
git commit -m "feat(pages): add Vietnamese/Japanese to EditBooking" || true

# ============= Frontend Pages - Incidents =============
echo "🚨 Incident Management Pages..."

git add frontend/src/pages/IncidentList.tsx
git commit -m "feat(pages): implement i18n in IncidentList page" || true

git add frontend/src/pages/CreateIncident.tsx
git commit -m "feat(pages): add multi-language support to CreateIncident" || true

git add frontend/src/pages/IncidentDetails.tsx
git commit -m "feat(pages): add Vietnamese/Japanese to IncidentDetails" || true

# ============= Frontend Pages - Ideas =============
echo "💡 Idea Management Pages..."

git add frontend/src/pages/IdeaList.tsx
git commit -m "feat(pages): implement i18n in IdeaList page" || true

git add frontend/src/pages/CreateIdea.tsx
git commit -m "feat(pages): add multi-language support to CreateIdea" || true

git add frontend/src/pages/IdeaDetails.tsx
git commit -m "feat(pages): add Vietnamese/Japanese to IdeaDetails" || true

# ============= Frontend Pages - News =============
echo "📰 News Management Pages..."

git add frontend/src/pages/NewsList.tsx
git commit -m "feat(pages): implement i18n in NewsList page" || true

git add frontend/src/pages/CreateNews.tsx
git commit -m "feat(pages): add multi-language support to CreateNews" || true

git add frontend/src/pages/NewsDetails.tsx
git commit -m "feat(pages): add Vietnamese/Japanese to NewsDetails" || true

# ============= Frontend Components - Common =============
echo "🧩 Common Components..."

git add frontend/src/components/common/LanguageSwitcher.tsx
git commit -m "feat(components): enhance LanguageSwitcher with flags" || true

git add frontend/src/components/common/ThemeToggleButton.tsx
git commit -m "refactor(components): fix ThemeToggleButton context import" || true

git add frontend/src/components/common/ThemeTogglerTwo.tsx
git commit -m "refactor(components): fix ThemeTogglerTwo context import" || true

git add frontend/src/components/common/Breadcrumb.tsx
git commit -m "feat(components): add i18n support to Breadcrumb" || true

# ============= Frontend Components - Dashboard =============
echo "📊 Dashboard Components..."

git add frontend/src/components/dashboard/ 2>/dev/null || true
git commit -m "feat(dashboard): implement i18n in dashboard components" || true

# ============= Frontend Components - Charts =============
echo "📈 Chart Components..."

git add frontend/src/components/charts/ 2>/dev/null || true
git commit -m "feat(charts): add Vietnamese/Japanese to chart components" || true

git add frontend/src/components/chart-dashboard/ 2>/dev/null || true
git commit -m "feat(charts): update dashboard chart translations" || true

git add frontend/src/components/chart-incident-report/ 2>/dev/null || true
git commit -m "feat(charts): add i18n to incident report charts" || true

# ============= Frontend Components - Feedback =============
echo "⭐ Feedback Components..."

git add frontend/src/components/feedback/ 2>/dev/null || true
git commit -m "feat(feedback): implement i18n in feedback components" || true

git add frontend/src/components/feadback-chart/ 2>/dev/null || true
git commit -m "feat(feedback): update feedback chart translations" || true

# ============= Frontend Services =============
echo "🔌 Frontend Services..."

git add frontend/src/services/ 2>/dev/null || true
git commit -m "refactor(services): optimize API service layer" || true

# ============= Frontend Types =============
echo "📝 TypeScript Types..."

git add frontend/src/types/ 2>/dev/null || true
git commit -m "refactor(types): update TypeScript definitions" || true

# ============= Frontend Configuration =============
echo "⚙️  Frontend Config..."

git add frontend/package.json frontend/package-lock.json
git commit -m "build(frontend): update React 19 and dependencies" || true

git add frontend/vite.config.ts
git commit -m "config(frontend): optimize Vite build configuration" || true

git add frontend/tsconfig.json frontend/tsconfig.app.json frontend/tsconfig.node.json
git commit -m "config(frontend): update TypeScript compiler options" || true

git add frontend/eslint.config.js
git commit -m "config(frontend): update ESLint configuration" || true

git add frontend/postcss.config.js
git commit -m "config(frontend): update PostCSS configuration" || true

git add frontend/.gitignore
git commit -m "chore(frontend): update gitignore patterns" || true

# ============= Documentation =============
echo "📚 Documentation..."

git add README.md
git commit -m "docs(readme): update with MongoDB GridFS architecture" || true

git add docs/ 2>/dev/null || true
git commit -m "docs(specs): update system documentation" || true

# ============= Cleanup Deleted Files =============
echo "🧹 Cleanup..."

git add -u .
git commit -m "chore(cleanup): remove obsolete files and documentation" || true

# ============= Final Catch-All =============
echo "✨ Final Changes..."

git add .
git commit -m "chore(project): finalize MongoDB integration and i18n system" || true

# ============= Display Summary =============
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Commit Summary (Last 50)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git log --oneline -50 --graph --decorate

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Repository Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git status

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Ready to Push"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Branch: $(git branch --show-current)"
echo "Remote: $(git remote get-url origin)"
echo ""

read -p "📤 Push to GitHub now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Pushing to origin $(git branch --show-current)..."
    git push origin $(git branch --show-current) --verbose
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Successfully pushed to GitHub!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo ""
    echo "⏸️  Push cancelled."
    echo "Run: git push origin $(git branch --show-current)"
fi

echo ""
echo "🎉 Complete!"
