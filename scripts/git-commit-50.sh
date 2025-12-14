#!/bin/bash

# Professional Git Commit Script - 50 Detailed Commits
# SmartFactory CONNECT Web Application
# Date: December 14, 2025

set -e
cd "$(dirname "$0")/.."

echo "🚀 SmartFactory CONNECT - Professional Git Commit Script"
echo "========================================================"
echo ""

# ============= Commit 1-5: Project Root & Documentation =============
echo "[1/50] Root configuration files..."
git add .gitignore README.md
git commit -m "docs: update project README and gitignore configuration" || true

echo "[2/50] Remove obsolete translation test documentation..."
git add -u TRANSLATION_TESTING.md TRANSLATION_TEST_GUIDE.md 2>/dev/null || true
git commit -m "chore: remove obsolete translation testing documentation" || true

# ============= Commit 6-15: Backend Docker & Configuration =============
echo "[3/50] Backend Docker configuration..."
git add backend/.dockerignore backend/Dockerfile
git commit -m "build(backend): add Docker configuration and ignore rules" || true

git add backend/logs/
git commit -m "chore(backend): add logs directory for application logging" || true

echo "[4/50] Swagger API documentation..."
git add backend/src/config/swagger.js
git commit -m "docs(backend): add Swagger/OpenAPI configuration" || true

echo "[5/50] Rate limiting middleware..."
git add backend/src/middlewares/rate-limit.middleware.js
git commit -m "feat(backend): implement rate limiting middleware for API protection" || true

echo "[6/50] Database migration runner..."
git add backend/src/database/migrations/run-migrations.js
git commit -m "feat(backend): add automated database migration runner" || true

echo "[7/50] Remove obsolete backend scripts..."
git add -u backend/create_pending_bookings_view.sql backend/insert_rooms.sql
git commit -m "chore(backend): remove obsolete SQL setup scripts" || true

git add -u backend/quick-test.js backend/scan-services.js
git commit -m "chore(backend): remove development test scripts" || true

git add -u backend/setup-room-booking-db.js
git commit -m "chore(backend): remove old room booking setup script" || true

git add -u backend/test-mdns-discovery.js backend/test-new-features.sh backend/test-translation.js
git commit -m "chore(backend): remove experimental test files" || true

# ============= Commit 16-25: Frontend Docker & Configuration =============
echo "[8/50] Frontend Docker configuration..."
git add frontend/.dockerignore frontend/Dockerfile frontend/nginx.conf
git commit -m "build(frontend): add Docker and nginx production configuration" || true

echo "[9/50] Frontend environment and package updates..."
git add frontend/.env frontend/.gitignore
git commit -m "config(frontend): update environment variables and gitignore" || true

git add frontend/package.json
git commit -m "build(frontend): update React 19 and project dependencies" || true

git add frontend/index.html
git commit -m "feat(frontend): update HTML template with metadata" || true

# ============= Commit 26-35: Frontend i18n System =============
echo "[10/50] Internationalization system..."
git add frontend/src/i18n/
git commit -m "feat(i18n): complete Vietnamese/Japanese translation system with 400+ keys" || true

echo "[11/50] Language context and hooks..."
git add frontend/src/contexts/LanguageContext.tsx
git commit -m "feat(contexts): enhance LanguageContext for multi-language support" || true

git add frontend/src/hooks/useDynamicText.ts
git commit -m "feat(hooks): add useDynamicText hook for dynamic translations" || true

echo "[12/50] Language switcher component..."
git add frontend/src/components/common/LanguageSwitcher.tsx
git commit -m "feat(components): enhance LanguageSwitcher with Vietnamese/Japanese flags" || true

git add frontend/src/components/common/TranslatedText.tsx
git commit -m "feat(components): add TranslatedText wrapper component" || true

# ============= Commit 36-40: Frontend Context Refactoring =============
echo "[13/50] Context folder consolidation..."
git add frontend/src/contexts/SidebarContext.tsx frontend/src/contexts/ThemeContext.tsx
git commit -m "refactor(contexts): consolidate Sidebar and Theme contexts" || true

git add frontend/src/contexts/AuthContext.tsx
git commit -m "refactor(contexts): update AuthContext with enhanced type safety" || true

git add -u frontend/src/context/
git commit -m "chore(frontend): remove duplicate context folder after consolidation" || true

echo "[14/50] Layout components context imports..."
git add frontend/src/layout/AppLayout.tsx frontend/src/layout/Backdrop.tsx
git commit -m "refactor(layout): fix context imports in AppLayout and Backdrop" || true

git add frontend/src/layout/AppHeader.tsx frontend/src/layout/AppSidebar.tsx
git commit -m "refactor(layout): update context imports in AppHeader and AppSidebar" || true

git add frontend/src/layout/AppSidebar.new.tsx frontend/src/layout/sidebar/
git commit -m "feat(layout): add new sidebar implementation with improved UX" || true

echo "[15/50] Theme components updates..."
git add frontend/src/components/common/ThemeToggleButton.tsx frontend/src/components/common/ThemeTogglerTwo.tsx
git commit -m "refactor(components): fix ThemeContext imports in theme toggles" || true

git add frontend/src/main.tsx
git commit -m "refactor(main): update context provider imports in app entry" || true

git add frontend/src/App.tsx
git commit -m "refactor(app): update App.tsx with context changes" || true

git add frontend/src/index.css
git commit -m "style: update global CSS styles" || true

# ============= Commit 41-45: Frontend UI Components =============
echo "[16/50] UI component library..."
git add frontend/src/components/ui/
git commit -m "feat(ui): add comprehensive UI component library (cards, tables, badges)" || true

echo "[17/50] Dashboard components..."
git add frontend/src/components/dashboard/
git commit -m "feat(dashboard): add new dashboard components with i18n support" || true

git add frontend/src/pages/Dashboard/EnterpriseDashboard.tsx frontend/src/pages/Dashboard/components/ frontend/src/pages/Dashboard/hooks/
git commit -m "feat(dashboard): implement enterprise dashboard with advanced metrics" || true

echo "[18/50] Global search component..."
git add frontend/src/components/header/GlobalSearch.tsx frontend/src/components/header/GlobalSearch/
git commit -m "feat(components): add global search with autocomplete" || true

# ============= Commit 46-50: Frontend Pages & Services =============
echo "[19/50] Room booking UI components..."
git add frontend/src/components/room-booking/booking-detail/ frontend/src/components/room-booking/calendar/
git commit -m "feat(booking): add enhanced booking detail and calendar components" || true

echo "[20/50] Chat Assistant improvements..."
git add frontend/src/components/ChatAssistant/ChatAssistant.tsx frontend/src/components/ChatAssistant/MessageList.tsx
git commit -m "feat(chat): update ChatAssistant with improved message handling" || true

git add frontend/src/components/ChatAssistant/ChatAssistant.new.tsx frontend/src/components/ChatAssistant/command.types.ts
git commit -m "feat(chat): add new ChatAssistant implementation with command types" || true

git add frontend/src/components/ChatAssistant/commandHandler.new.ts frontend/src/components/ChatAssistant/messageHandlers.ts
git commit -m "feat(chat): implement command and message handlers" || true

git add frontend/src/components/ChatAssistant/handlers/ frontend/src/components/ChatAssistant/utils/
git commit -m "feat(chat): add specialized handlers and utility functions" || true

git add frontend/src/components/ChatAssistant/roomBookingHandler.ts frontend/src/components/ChatAssistant/useNotificationPolling.ts
git commit -m "refactor(chat): update room booking handler and notification polling" || true

echo "[21/50] Error Report components..."
git add frontend/src/components/ErrorReport/Badges.tsx frontend/src/components/ErrorReport/KanbanCard.tsx
git commit -m "feat(incident): update incident badges and kanban card with i18n" || true

git add frontend/src/components/ErrorReport/KanbanColumn.tsx frontend/src/components/ErrorReport/ListView.tsx
git commit -m "feat(incident): enhance kanban column and list view components" || true

git add frontend/src/components/ErrorReport/index.ts
git commit -m "refactor(incident): update ErrorReport module exports" || true

git add -u frontend/src/components/ErrorReport/data.ts frontend/src/components/ErrorReport/mockData.ts
git commit -m "chore(incident): remove mock data files in favor of API integration" || true

echo "[22/50] Auth components..."
git add frontend/src/components/auth/SignInForm.tsx
git commit -m "feat(auth): enhance SignInForm with better validation" || true

git add frontend/src/pages/AuthPages/AuthPageLayout.tsx
git commit -m "feat(auth): update auth page layout with i18n" || true

git add frontend/src/pages/AuthPages/SignIn.tsx frontend/src/pages/AuthPages/SignUp.tsx
git commit -m "feat(auth): implement i18n in SignIn and SignUp pages" || true

echo "[23/50] Chart components - Dashboard..."
git add frontend/src/components/chart-dashboard/IncidentTypePieChart.tsx frontend/src/components/chart-dashboard/KpiPerformanceChart.tsx
git commit -m "feat(charts): add i18n to dashboard pie and KPI charts" || true

git add frontend/src/components/chart-dashboard/TimeMetrics.tsx frontend/src/components/chart-dashboard/TopFaultyMachinesChart.tsx
git commit -m "feat(charts): implement i18n in time metrics and machine charts" || true

echo "[24/50] Chart components - Incident Report..."
git add frontend/src/components/chart-incident-report/AvgTimeStats.tsx frontend/src/components/chart-incident-report/DepartmentKPIChart.tsx
git commit -m "feat(charts): add i18n to incident report statistics" || true

git add frontend/src/components/chart-incident-report/IncidentOverview.tsx frontend/src/components/chart-incident-report/IncidentTypePieChart.tsx
git commit -m "feat(charts): implement i18n in incident overview charts" || true

git add frontend/src/components/chart-incident-report/ResolveTimeCard.tsx frontend/src/components/chart-incident-report/ResponseTimeCard.tsx
git commit -m "feat(charts): add i18n to time tracking cards" || true

git add frontend/src/components/chart-incident-report/TopMachinesBarChart.tsx
git commit -m "feat(charts): implement i18n in top machines bar chart" || true

echo "[25/50] Common components..."
git add frontend/src/components/common/ChartTab.tsx
git commit -m "feat(components): add i18n support to ChartTab component" || true

git add frontend/src/components/types/index.ts
git commit -m "refactor(types): update shared component types" || true

echo "[26/50] E-commerce components..."
git add frontend/src/components/ecommerce/DemographicCard.tsx frontend/src/components/ecommerce/EcommerceMetrics.tsx
git commit -m "feat(ecommerce): add i18n to demographic and metrics components" || true

git add frontend/src/components/ecommerce/MonthlySalesChart.tsx frontend/src/components/ecommerce/MonthlyTarget.tsx
git commit -m "feat(ecommerce): implement i18n in sales charts" || true

git add frontend/src/components/ecommerce/RecentOrders.tsx frontend/src/components/ecommerce/StatisticsChart.tsx
git commit -m "feat(ecommerce): add i18n to orders and statistics" || true

echo "[27/50] Feedback chart components..."
git add frontend/src/components/feadback-chart/FeedbackDifficultyChart.tsx frontend/src/components/feadback-chart/FeedbackMetrics.tsx
git commit -m "feat(feedback): add i18n to feedback difficulty charts" || true

git add frontend/src/components/feadback-chart/FeedbackRatingChart.tsx
git commit -m "feat(feedback): implement i18n in rating chart" || true

echo "[28/50] Feedback components..."
git add frontend/src/components/feedback/ActionPanel.tsx frontend/src/components/feedback/IdeaChat.tsx
git commit -m "feat(feedback): add i18n to action panel and idea chat" || true

git add frontend/src/components/feedback/IdeaDetail.tsx frontend/src/components/feedback/IdeaHistory.tsx
git commit -m "feat(feedback): implement i18n in idea detail and history" || true

git add frontend/src/components/feedback/IdeaList.tsx frontend/src/components/feedback/MessageDetailView.tsx
git commit -m "feat(feedback): add i18n to idea list and message detail" || true

git add frontend/src/components/feedback/MessageList.tsx frontend/src/components/feedback/types.ts
git commit -m "feat(feedback): update message list and types with i18n" || true

git add -u frontend/src/components/feedback/data.ts frontend/src/components/feedback/dummyData.ts
git commit -m "chore(feedback): remove mock data in favor of API calls" || true

echo "[29/50] Header components..."
git add frontend/src/components/header/Header.tsx frontend/src/components/header/NotificationDropdown.tsx
git commit -m "feat(header): implement i18n in header and notifications" || true

echo "[30/50] News components..."
git add frontend/src/components/news/NewsCard.tsx frontend/src/components/news/NewsDetailModal.tsx
git commit -m "feat(news): add i18n to news card and detail modal" || true

git add frontend/src/components/news/NewsForm.tsx frontend/src/components/news/NewsList.tsx
git commit -m "feat(news): implement i18n in news form and list" || true

echo "[31/50] Room booking components..."
git add frontend/src/components/room-booking/BookingDetailModal.tsx frontend/src/components/room-booking/BookingFormModal.tsx
git commit -m "feat(booking): add i18n to booking modals" || true

git add frontend/src/components/room-booking/RoomBookingCalendar.tsx
git commit -m "feat(booking): implement i18n in calendar component" || true

echo "[32/50] Dashboard pages..."
git add frontend/src/pages/Dashboard/Home.tsx
git commit -m "feat(pages): implement i18n in dashboard home page" || true

git add frontend/src/pages/Dashboard/FeedbackDashboard.tsx
git commit -m "feat(pages): add i18n to feedback dashboard" || true

git add frontend/src/pages/Dashboard/IncidentReportPage.tsx
git commit -m "feat(pages): implement i18n in incident report page" || true

echo "[33/50] Error Report pages..."
git add frontend/src/pages/ErrorReport/AllIncidentsPage.tsx frontend/src/pages/ErrorReport/IncidentQueue.tsx
git commit -m "feat(pages): add i18n to incident management pages" || true

echo "[34/50] User Management pages..."
git add frontend/src/pages/UserManagement/UserList.tsx
git commit -m "feat(pages): implement i18n in user list page" || true

git add frontend/src/pages/UserManagement/DepartmentList.tsx
git commit -m "feat(pages): add i18n to department list page" || true

git add frontend/src/pages/UserProfiles.tsx
git commit -m "feat(pages): implement i18n in user profiles page" || true

echo "[35/50] Feedback pages..."
git add frontend/src/pages/feedback/AdminInboxPink.tsx
git commit -m "feat(pages): add i18n to admin inbox page" || true

git add frontend/src/pages/feedback/PublicIdeasPage.tsx
git commit -m "feat(pages): implement i18n in public ideas page" || true

echo "[36/50] News pages..."
git add frontend/src/pages/news/NewIndex.tsx
git commit -m "feat(pages): add i18n to news index page" || true

echo "[37/50] Booking pages..."
git add frontend/src/pages/Calendar.tsx
git commit -m "feat(pages): implement i18n in calendar page" || true

git add frontend/src/pages/RoomBookingPage.tsx frontend/src/pages/MyBookingsPage.tsx
git commit -m "feat(pages): add i18n to booking management pages" || true

echo "[38/50] Admin pages..."
git add frontend/src/pages/AdminApprovalPage.tsx
git commit -m "feat(pages): implement i18n in admin approval page" || true

git add frontend/src/pages/storage/KaizenBankPage.tsx
git commit -m "feat(pages): add i18n to kaizen bank storage page" || true

echo "[39/50] UI Elements pages..."
git add frontend/src/pages/UiElements/Alerts.tsx frontend/src/pages/UiElements/Avatars.tsx
git commit -m "feat(pages): implement i18n in alerts and avatars pages" || true

git add frontend/src/pages/UiElements/Badges.tsx frontend/src/pages/UiElements/Buttons.tsx
git commit -m "feat(pages): add i18n to badges and buttons pages" || true

git add frontend/src/pages/UiElements/Images.tsx frontend/src/pages/UiElements/Videos.tsx
git commit -m "feat(pages): implement i18n in media element pages" || true

echo "[40/50] Charts pages..."
git add frontend/src/pages/Charts/BarChart.tsx frontend/src/pages/Charts/LineChart.tsx
git commit -m "feat(pages): add i18n to chart demonstration pages" || true

echo "[41/50] Forms and Tables pages..."
git add frontend/src/pages/Forms/FormElements.tsx
git commit -m "feat(pages): implement i18n in form elements page" || true

git add frontend/src/pages/Tables/BasicTables.tsx
git commit -m "feat(pages): add i18n to tables page" || true

echo "[42/50] Other pages..."
git add frontend/src/pages/Blank.tsx
git commit -m "feat(pages): update blank page template" || true

git add frontend/src/pages/OtherPage/NotFound.tsx
git commit -m "feat(pages): implement i18n in 404 not found page" || true

git add frontend/src/pages/TranslationTest.tsx
git commit -m "feat(pages): add translation testing page" || true

git add -u frontend/src/pages/demo/LoadingDemo.tsx
git commit -m "chore(pages): remove demo loading page" || true

git add -u frontend/src/data/notifications.data.ts
git commit -m "chore(frontend): remove static notification data" || true

echo "[43/50] Frontend services..."
git add frontend/src/services/api.ts
git commit -m "refactor(services): enhance API client with better error handling" || true

git add frontend/src/services/notification.service.ts
git commit -m "refactor(services): update notification service" || true

git add frontend/src/services/dashboard.service.ts
git commit -m "feat(services): add dashboard data service" || true

git add frontend/src/services/idea.service.ts
git commit -m "feat(services): implement idea management service" || true

git add frontend/src/services/incident.service.ts
git commit -m "feat(services): add incident tracking service" || true

git add frontend/src/services/user.service.ts
git commit -m "feat(services): implement user management service" || true

echo "[44/50] TypeScript types..."
git add frontend/src/types/notification.types.ts
git commit -m "refactor(types): update notification type definitions" || true

git add frontend/src/types/api.types.ts frontend/src/types/common.types.ts
git commit -m "feat(types): add comprehensive API and common types" || true

git add frontend/src/types/booking.types.ts
git commit -m "feat(types): implement room booking type definitions" || true

git add frontend/src/types/dashboard.types.ts
git commit -m "feat(types): add dashboard metrics type definitions" || true

git add frontend/src/types/escalation.types.ts
git commit -m "feat(types): implement incident escalation types" || true

git add frontend/src/types/idea.types.ts frontend/src/types/news.types.ts
git commit -m "feat(types): add idea and news type definitions" || true

git add frontend/src/types/incident.types.ts
git commit -m "feat(types): implement comprehensive incident types" || true

git add frontend/src/types/ui.types.ts frontend/src/types/user.types.ts
git commit -m "feat(types): add UI component and user type definitions" || true

git add frontend/src/types/index.ts
git commit -m "refactor(types): centralize type exports" || true

echo "[45/50] Scripts directory..."
git add scripts/
git commit -m "chore(scripts): add deployment and utility scripts" || true

echo "[46/50] Final cleanup - DS_Store..."
git add .DS_Store
git commit -m "chore: update macOS metadata file" || true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Git Commit Summary (Last 50)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git log --oneline -50 --graph --decorate --color

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Repository Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git status

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Ready to Push to GitHub"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Branch: $(git branch --show-current)"
echo "Remote: $(git remote get-url origin 2>/dev/null || echo 'Not configured')"
echo "Total commits ahead: $(git log --oneline origin/$(git branch --show-current)..HEAD 2>/dev/null | wc -l | tr -d ' ')"
echo ""

read -p "📤 Push all commits to GitHub now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Pushing to origin $(git branch --show-current)..."
    git push origin $(git branch --show-current) --verbose
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Successfully pushed to GitHub!"
    echo "🔗 https://github.com/Vudangkhoa0910/SmartFactory_CONNECT_Web"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo ""
    echo "⏸️  Push cancelled."
    echo "To push manually, run:"
    echo "  git push origin $(git branch --show-current)"
fi

echo ""
echo "🎉 Complete! 46 professional commits created."
echo "📝 Each commit follows conventional commit format"
echo "🏷️  Commits organized by: docs, feat, refactor, build, chore"
