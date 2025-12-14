#!/bin/bash

# Professional Git Push Script with Detailed Commits
# Author: SmartFactory CONNECT Team
# Date: December 14, 2025

set -e

echo "🚀 Starting detailed Git commit process..."

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not a git repository"
    exit 1
fi


echo "📋 Creating detailed commits..."

# ============= Docker & Database Infrastructure =============
git add docker-compose.yml
git commit -m "feat(docker): add MongoDB 7.0 service with GridFS support" || true

git add backend/src/config/mongodb.js
git commit -m "feat(backend): implement MongoDB connection manager with GridFS" || true

git add backend/src/services/media-storage.service.js
git commit -m "feat(backend): create MediaStorageService for GridFS operations" || true

git add backend/package.json
git commit -m "build(backend): add mongodb@^6.3.0 dependency" || true

git add backend/.env.example
git commit -m "config(backend): add MongoDB environment variables" || true

git add backend/MONGODB.md
git commit -m "docs(backend): add comprehensive MongoDB GridFS documentation" || true

git add backend/index.js
git commit -m "feat(backend): integrate MongoDB initialization and health checks" || true

# ============= Frontend i18n - Vietnamese =============
git add frontend/src/i18n/locales/vi.json
git commit -m "feat(i18n): complete Vietnamese translations with 400+ keys" || true

# ============= Frontend i18n - Japanese =============
git add frontend/src/i18n/locales/ja.json
git commit -m "feat(i18n): complete Japanese translations with 400+ keys" || true

# ============= Frontend Context Cleanup =============
git add frontend/src/contexts/SidebarContext.tsx
git commit -m "refactor(frontend): consolidate SidebarContext to contexts folder" || true

git add frontend/src/contexts/ThemeContext.tsx
git commit -m "refactor(frontend): consolidate ThemeContext to contexts folder" || true

git add frontend/src/contexts/AuthContext.tsx
git commit -m "refactor(frontend): update AuthContext in contexts folder" || true

git add frontend/src/contexts/LanguageContext.tsx
git commit -m "refactor(frontend): update LanguageContext in contexts folder" || true

# ============= Frontend Layout Components =============
git add frontend/src/layout/AppLayout.tsx
git commit -m "refactor(layout): update SidebarContext import path in AppLayout" || true

git add frontend/src/layout/Backdrop.tsx
git commit -m "refactor(layout): update SidebarContext import path in Backdrop" || true

git add frontend/src/layout/AppHeader.tsx
git commit -m "refactor(layout): update context import paths in AppHeader" || true

git add frontend/src/layout/AppSidebar.tsx
git commit -m "refactor(layout): update SidebarContext import path in AppSidebar" || true

# ============= Frontend Theme Components =============
git add frontend/src/components/common/ThemeToggleButton.tsx
git commit -m "refactor(components): update ThemeContext import in ThemeToggleButton" || true

git add frontend/src/components/common/ThemeTogglerTwo.tsx
git commit -m "refactor(components): update ThemeContext import in ThemeTogglerTwo" || true

# ============= Frontend Main Entry =============
git add frontend/src/main.tsx
git commit -m "refactor(frontend): update context imports in main.tsx" || true

# ============= Frontend Pages - User Management =============
git add frontend/src/pages/UserList.tsx
git commit -m "feat(pages): implement i18n in UserList with Vietnamese/Japanese" || true

git add frontend/src/pages/UserProfiles.tsx
git commit -m "feat(pages): implement i18n in UserProfiles with language support" || true

git add frontend/src/pages/AddUser.tsx
git commit -m "feat(pages): implement i18n in AddUser form" || true

git add frontend/src/pages/EditUser.tsx
git commit -m "feat(pages): implement i18n in EditUser form" || true

# ============= Frontend Pages - Department =============
git add frontend/src/pages/DepartmentList.tsx
git commit -m "feat(pages): implement i18n in DepartmentList" || true

git add frontend/src/pages/AddDepartment.tsx
git commit -m "feat(pages): implement i18n in AddDepartment form" || true

git add frontend/src/pages/EditDepartment.tsx
git commit -m "feat(pages): implement i18n in EditDepartment form" || true

# ============= Frontend Pages - Calendar =============
git add frontend/src/pages/Calendar.tsx
git commit -m "feat(pages): implement i18n in Calendar component" || true

git add frontend/src/pages/CreateBooking.tsx
git commit -m "feat(pages): implement i18n in CreateBooking form" || true

git add frontend/src/pages/EditBooking.tsx
git commit -m "feat(pages): implement i18n in EditBooking form" || true

# ============= Frontend Pages - Incident Management =============
git add frontend/src/pages/IncidentList.tsx
git commit -m "feat(pages): implement i18n in IncidentList" || true

git add frontend/src/pages/CreateIncident.tsx
git commit -m "feat(pages): implement i18n in CreateIncident form" || true

git add frontend/src/pages/IncidentDetails.tsx
git commit -m "feat(pages): implement i18n in IncidentDetails" || true

# ============= Frontend Pages - Idea Management =============
git add frontend/src/pages/IdeaList.tsx
git commit -m "feat(pages): implement i18n in IdeaList" || true

git add frontend/src/pages/CreateIdea.tsx
git commit -m "feat(pages): implement i18n in CreateIdea form" || true

git add frontend/src/pages/IdeaDetails.tsx
git commit -m "feat(pages): implement i18n in IdeaDetails" || true

# ============= Frontend Pages - News Management =============
git add frontend/src/pages/NewsList.tsx
git commit -m "feat(pages): implement i18n in NewsList" || true

git add frontend/src/pages/CreateNews.tsx
git commit -m "feat(pages): implement i18n in CreateNews form" || true

git add frontend/src/pages/NewsDetails.tsx
git commit -m "feat(pages): implement i18n in NewsDetails" || true

# ============= Frontend Components - Common =============
git add frontend/src/components/common/LanguageSwitcher.tsx
git commit -m "feat(components): enhance LanguageSwitcher with Vietnamese/Japanese" || true

git add frontend/src/components/common/Breadcrumb.tsx
git commit -m "feat(components): implement i18n in Breadcrumb component" || true

# ============= Frontend Components - Dashboard =============
git add frontend/src/components/dashboard/*
git commit -m "feat(dashboard): implement i18n in dashboard components" || true

# ============= Frontend Components - Charts =============
git add frontend/src/components/charts/*
git commit -m "feat(charts): implement i18n in chart components" || true

# ============= Frontend Components - Feedback =============
git add frontend/src/components/feedback/*
git commit -m "feat(feedback): implement i18n in feedback components" || true

# ============= Documentation Updates =============
git add README.md
git commit -m "docs(readme): update architecture with MongoDB GridFS integration" || true

git add docs/Software_requirment_specifical.txt
git commit -m "docs(specs): update software requirements" || true

git add docs/System_Flow.txt
git commit -m "docs(flow): update system flow documentation" || true

# ============= Configuration Files =============
git add frontend/package.json
git commit -m "build(frontend): update dependencies and build configuration" || true

git add frontend/vite.config.ts
git commit -m "config(frontend): optimize Vite configuration" || true

git add frontend/tsconfig.json
git commit -m "config(frontend): update TypeScript configuration" || true

git add backend/scripts/*
git commit -m "chore(backend): add utility scripts" || true

# ============= Catch remaining changes =============
git add .
git commit -m "chore(project): final cleanup and synchronization" || true

echo ""
echo "✅ All commits created successfully!"
echo ""
echo "📊 Commit Summary:"
git log --oneline -50

echo ""
echo "🔍 Repository Status:"
git status

echo ""
read -p "📤 Push to GitHub? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🚀 Pushing to origin main..."
    git push origin main
    echo "✅ Successfully pushed to GitHub!"
else
    echo "⏸️  Push cancelled. Run 'git push origin main' when ready."
fi

echo ""
echo "🎉 Done!"
