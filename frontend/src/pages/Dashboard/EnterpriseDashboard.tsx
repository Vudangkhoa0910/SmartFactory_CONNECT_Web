/**
 * Enterprise Dashboard - SmartFactory CONNECT
 * Automotive Parts Factory - Enhanced Layout
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useTranslation } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

// Lucide Icons
import {
  AlertTriangle, CheckCircle, Lightbulb, Users, RefreshCw, Factory,
  TrendingUp, TrendingDown, Package, Inbox, Shield, Calendar, FileText,
  Activity, Wrench, Zap, BarChart3, PieChart, Bell, ChevronRight,
  AlertCircle, Clock, CalendarDays, Award, Target, Flame
} from 'lucide-react';

import { useDashboardData, computeDashboardValues } from './hooks';

// ===== MOCK DATA =====
const MOCK_PRIORITY = [3, 5, 8, 12];
const MOCK_DEPTS = [
  { department_name: 'Lắp ráp', kpi_percentage: 92 },
  { department_name: 'QC', kpi_percentage: 88 },
  { department_name: 'Kho', kpi_percentage: 85 },
  { department_name: 'Bảo trì', kpi_percentage: 78 },
  { department_name: 'Đóng gói', kpi_percentage: 95 },
];
const MOCK_ACTIVITIES = [
  { id: 1, title: 'Sự cố mới', description: 'Máy dập #3 cần kiểm tra', type: 'incident', created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: 2, title: 'Góp ý cải tiến', description: 'Đề xuất tối ưu QC', type: 'feedback', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, title: 'Đã xử lý xong', description: 'Băng chuyền B2', type: 'resolved', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 4, title: 'Bảo trì định kỳ', description: 'Máy CNC tuần tới', type: 'maintenance', created_at: new Date(Date.now() - 18000000).toISOString() },
];
const MOCK_SCHEDULE = [
  { id: 1, title: 'Bảo trì máy CNC #2', time: '14:00', type: 'maintenance' },
  { id: 2, title: 'Họp đánh giá chất lượng', time: '15:30', type: 'meeting' },
  { id: 3, title: 'Kiểm tra an toàn định kỳ', time: '16:00', type: 'safety' },
];
const METRICS = { parts: 15420, target: 18000, quality: 99.2, oee: 87.3, uptime: 96.5, whitebox: 24, pinkbox: 7, safety: 128 };

export default function EnterpriseDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { summary, incidentStats, departmentStats, activities, loading, error, refetch } = useDashboardData();
  const values = computeDashboardValues(summary);
  const isDark = theme === 'dark';

  // Live clock
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute shift info
  const hour = time.getHours();
  const currentShift = hour >= 6 && hour < 14 ? 1 : hour >= 14 && hour < 22 ? 2 : 3;
  const shiftEnd = currentShift === 1 ? '14:00' : currentShift === 2 ? '22:00' : '06:00';

  // Data with fallback - FIXED
  const priorityData = (incidentStats?.by_priority &&
    (incidentStats.by_priority.critical > 0 || incidentStats.by_priority.high > 0 ||
      incidentStats.by_priority.medium > 0 || incidentStats.by_priority.low > 0))
    ? [incidentStats.by_priority.critical || 0, incidentStats.by_priority.high || 0, incidentStats.by_priority.medium || 0, incidentStats.by_priority.low || 0]
    : MOCK_PRIORITY;

  // FIXED: Always use mock if no valid data - improved validation
  const deptStats = (
    departmentStats &&
    Array.isArray(departmentStats) &&
    departmentStats.length > 0 &&
    departmentStats.some(d => d.kpi_percentage !== undefined && d.kpi_percentage !== null && d.kpi_percentage > 0)
  ) ? departmentStats : MOCK_DEPTS;

  const activityList = activities.length > 0 ? activities : MOCK_ACTIVITIES;
  const progress = Math.round((METRICS.parts / METRICS.target) * 100);

  // Compute average KPI safely
  const avgKpi = deptStats.length > 0
    ? Math.round(deptStats.reduce((a, d) => a + (d.kpi_percentage || 0), 0) / deptStats.length)
    : 0;

  if (error) return <ErrorView error={error} onRetry={refetch} t={t} isDark={isDark} />;

  return (
    <>
      <PageMeta title="Dashboard | SmartFactory CONNECT" description={t('dashboard.overview')} />

      <div className={`min-h-screen p-3 ${isDark ? 'bg-neutral-900' : 'bg-gray-50'}`}>

        {/* HEADER - with live clock */}
        <header className={`rounded-xl p-3 mb-3 flex items-center justify-between ${isDark ? 'bg-neutral-800' : 'bg-white'} border ${isDark ? 'border-neutral-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('menu.dashboard')}</h1>
              <p className={`text-xs flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                Ca {currentShift} • Kết thúc lúc {shiftEnd}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDark ? 'bg-neutral-700' : 'bg-gray-100'}`}>
              <Clock className="w-4 h-4 text-red-500" />
              <span className={`text-sm font-mono font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <button onClick={refetch} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* MAIN GRID - 12 cols */}
        <div className="grid grid-cols-12 gap-3">

          {/* LEFT - 8 cols */}
          <div className="col-span-12 lg:col-span-8 space-y-3">

            {/* Top 4 Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard title={t('dashboard.pending_incidents')} value={values.pendingIncidents || 8} icon={AlertTriangle} accent onClick={() => navigate('/all-incidents-page')} isDark={isDark} trend={{ value: 12, down: true }} />
              <StatCard title={t('dashboard.completion_rate')} value={`${values.resolutionRate || 85}%`} icon={CheckCircle} isDark={isDark} />
              <StatCard title={t('dashboard.contributions')} value={values.pendingIdeas || 15} icon={Lightbulb} onClick={() => navigate('/feedback/ideas')} isDark={isDark} />
              <StatCard title={t('dashboard.online_employees')} value={values.activeUsers || 127} icon={Users} isDark={isDark} />
            </div>

            {/* Production + Actions Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Production */}
              <Card isDark={isDark}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sản xuất hôm nay</span>
                  <span className="text-sm font-bold text-red-500">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-neutral-700 rounded-full mb-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                </div>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{METRICS.parts.toLocaleString()} / {METRICS.target.toLocaleString()} linh kiện</p>
                <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-neutral-700">
                  <MiniMetric label="CL" value={`${METRICS.quality}%`} />
                  <MiniMetric label="OEE" value={`${METRICS.oee}%`} />
                  <MiniMetric label="Uptime" value={`${METRICS.uptime}%`} />
                  <MiniMetric label="An toàn" value={`${METRICS.safety}d`} highlight />
                </div>
              </Card>

              {/* Quick Actions + Boxes */}
              <Card isDark={isDark}>
                <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('dashboard.quick_actions')}</span>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <ActionBtn icon={AlertTriangle} label="Sự cố" onClick={() => navigate('/incident-report-page')} isDark={isDark} />
                  <ActionBtn icon={Lightbulb} label="Góp ý" onClick={() => navigate('/public-ideas-page')} isDark={isDark} />
                  <ActionBtn icon={Calendar} label="Phòng" onClick={() => navigate('/room-booking')} isDark={isDark} />
                  <ActionBtn icon={FileText} label="Tin" onClick={() => navigate('/news')} isDark={isDark} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-neutral-700">
                  <BoxMetric icon={Package} label="Hòm trắng" value={METRICS.whitebox} isDark={isDark} />
                  <BoxMetric icon={Inbox} label="Hòm hồng" value={METRICS.pinkbox} isDark={isDark} />
                </div>
              </Card>
            </div>

            {/* Department Chart - FIXED */}
            <Card isDark={isDark}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-red-500" />
                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Hiệu suất phòng ban (Top 5)</span>
                </div>
                <span className="text-xs px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded">TB: {avgKpi}%</span>
              </div>
              {loading ? (
                <div className="h-[160px] flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-red-300 animate-spin" />
                </div>
              ) : (
                <Chart
                  options={barOptions(deptStats, isDark)}
                  series={[{ name: 'KPI', data: deptStats.slice(0, 5).map(d => d.kpi_percentage || 0) }]}
                  type="bar"
                  height={160}
                />
              )}
            </Card>

            {/* BOTTOM SECTION - Useful Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              {/* Today's Schedule */}
              <Card isDark={isDark}>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="w-4 h-4 text-red-500" />
                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Lịch hôm nay</span>
                </div>
                <div className="space-y-2">
                  {MOCK_SCHEDULE.map(item => (
                    <ScheduleItem key={item.id} item={item} isDark={isDark} />
                  ))}
                </div>
              </Card>

              {/* Safety Streak */}
              <Card isDark={isDark} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500/20 to-transparent rounded-bl-full"></div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-red-500" />
                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Ngày an toàn</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-red-500">{METRICS.safety}</span>
                  <span className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>ngày liên tiếp</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <Award className="w-4 h-4 text-red-400" />
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Mục tiêu: 150 ngày</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-neutral-700 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full" style={{ width: `${(METRICS.safety / 150) * 100}%` }}></div>
                </div>
              </Card>

              {/* Performance Score */}
              <Card isDark={isDark} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500/20 to-transparent rounded-bl-full"></div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-red-500" />
                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Điểm hiệu suất</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="none" stroke={isDark ? '#374151' : '#e5e7eb'} strokeWidth="6" />
                      <circle
                        cx="32" cy="32" r="28" fill="none" stroke="#ef4444" strokeWidth="6"
                        strokeDasharray={`${2 * Math.PI * 28 * (METRICS.oee / 100)} ${2 * Math.PI * 28}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-red-500">{METRICS.oee}</span>
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>OEE Score</p>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {METRICS.oee >= 85 ? 'Xuất sắc' : METRICS.oee >= 70 ? 'Tốt' : 'Cần cải thiện'}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-red-500">+2.3%</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Summary Row */}
            <div className="grid grid-cols-4 gap-3">
              <SummaryBox label={t('dashboard.total_incidents')} value={values.totalIncidents || 33} primary isDark={isDark} />
              <SummaryBox label={t('dashboard.resolved')} value={values.resolvedIncidents || 28} isDark={isDark} />
              <SummaryBox label={t('dashboard.feedback_ideas')} value={values.totalIdeas || 42} isDark={isDark} />
              <SummaryBox label={t('dashboard.departments')} value={values.departmentsCount || 8} isDark={isDark} />
            </div>
          </div>

          {/* RIGHT - 4 cols */}
          <div className="col-span-12 lg:col-span-4 space-y-3">

            {/* Priority Chart */}
            <Card isDark={isDark}>
              <div className="flex items-center gap-2 mb-2">
                <PieChart className="w-4 h-4 text-red-500" />
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('dashboard.priority_distribution')}</span>
              </div>
              {loading ? (
                <div className="h-[180px] flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-red-300 animate-spin" />
                </div>
              ) : (
                <Chart options={donutOptions(priorityData.reduce((a, b) => a + b, 0), t, isDark)} series={priorityData} type="donut" height={180} />
              )}
            </Card>

            {/* Activities */}
            <Card isDark={isDark} noPadding>
              <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-neutral-700">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-red-500" />
                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('dashboard.recent_activities')}</span>
                </div>
                <button onClick={() => navigate('/activities')} className="text-xs text-red-500 flex items-center gap-0.5 hover:text-red-600">
                  Tất cả <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-neutral-700">
                {loading ? <Skeleton count={4} /> : activityList.slice(0, 4).map(a => <ActivityRow key={a.id} activity={a} isDark={isDark} />)}
              </div>
            </Card>

            {/* Admin Quick Access */}
            <div className="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-white/80" />
                <span className="text-white font-semibold text-sm">Admin Panel</span>
              </div>
              <div className="space-y-2">
                <AdminBtn icon={AlertTriangle} label="Xử lý sự cố" count={values.pendingIncidents || 8} onClick={() => navigate('/all-incidents-page')} primary />
                <AdminBtn icon={Lightbulb} label="Duyệt góp ý" count={values.pendingIdeas || 15} onClick={() => navigate('/feedback/ideas')} />
                <AdminBtn icon={Users} label="Quản lý nhân viên" onClick={() => navigate('/users')} />
              </div>
            </div>

            {/* Motivation/Tip */}
            <Card isDark={isDark} className="bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-neutral-800 border-red-100 dark:border-red-900/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Slogan hôm nay</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    "Chất lượng không phải là hành động, mà là thói quen." - Aristotle
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

// ===== COMPONENTS =====
type T = (k: string) => string;
type Icon = React.ComponentType<{ className?: string }>;

const Card = ({ children, isDark, noPadding, className = '' }: { children: React.ReactNode; isDark: boolean; noPadding?: boolean; className?: string }) => (
  <div className={`rounded-xl ${noPadding ? '' : 'p-4'} ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-100'} border ${className}`}>
    {children}
  </div>
);

const StatCard = ({ title, value, icon: I, accent, onClick, isDark, trend }: { title: string; value: string | number; icon: Icon; accent?: boolean; onClick?: () => void; isDark: boolean; trend?: { value: number; down: boolean } }) => (
  <div onClick={onClick} className={`rounded-xl p-4 ${accent ? 'bg-red-500 text-white' : isDark ? 'bg-neutral-800' : 'bg-white'} border ${accent ? 'border-red-400' : isDark ? 'border-neutral-700' : 'border-gray-100'} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className={`text-xs ${accent ? 'text-red-100' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
        <p className={`text-2xl font-bold mt-1 ${accent ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            {trend.down ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            <span className={`text-xs ${accent ? 'text-red-200' : 'text-red-500'}`}>{trend.value}%</span>
          </div>
        )}
      </div>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent ? 'bg-white/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
        <I className={`w-4 h-4 ${accent ? 'text-white' : 'text-red-500'}`} />
      </div>
    </div>
  </div>
);

const MiniMetric = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="text-center">
    <p className="text-xs text-gray-400">{label}</p>
    <p className={`text-sm font-bold ${highlight ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{value}</p>
  </div>
);

const ActionBtn = ({ icon: I, label, onClick, isDark }: { icon: Icon; label: string; onClick: () => void; isDark: boolean }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all hover:scale-105 ${isDark ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-gray-50 hover:bg-gray-100'}`}>
    <I className="w-4 h-4 text-red-500" />
    <span className={`text-[10px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{label}</span>
  </button>
);

const BoxMetric = ({ icon: I, label, value, isDark }: { icon: Icon; label: string; value: number; isDark: boolean }) => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
      <I className="w-4 h-4 text-red-500" />
    </div>
    <div>
      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    </div>
  </div>
);

const ScheduleItem = ({ item, isDark }: { item: { id: number; title: string; time: string; type: string }; isDark: boolean }) => {
  const colors: Record<string, string> = { maintenance: 'bg-red-100 text-red-600 dark:bg-red-900/30', meeting: 'bg-gray-100 text-gray-600 dark:bg-neutral-700', safety: 'bg-red-50 text-red-500 dark:bg-red-900/20' };
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${colors[item.type] || colors.meeting}`}>{item.time}</span>
      <span className={`text-xs truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.title}</span>
    </div>
  );
};

const SummaryBox = ({ label, value, primary, isDark }: { label: string; value: number; primary?: boolean; isDark: boolean }) => (
  <div className={`rounded-xl p-3 ${primary ? 'bg-red-500 text-white' : isDark ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-gray-100'}`}>
    <p className={`text-xs ${primary ? 'text-red-100' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
    <p className={`text-xl font-bold mt-1 ${primary ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
  </div>
);

const ActivityRow = ({ activity, isDark }: { activity: any; isDark: boolean }) => {
  const icons: Record<string, Icon> = { incident: AlertTriangle, resolved: CheckCircle, feedback: Lightbulb, maintenance: Wrench };
  const I = icons[activity.type] || Activity;
  return (
    <div className="flex items-center gap-2 p-3 hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
      <div className="w-7 h-7 rounded bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
        <I className="w-3.5 h-3.5 text-red-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{activity.title}</p>
        <p className={`text-[10px] truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{activity.description}</p>
      </div>
      <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{timeAgo(activity.created_at)}</span>
    </div>
  );
};

const AdminBtn = ({ icon: I, label, count, onClick, primary }: { icon: Icon; label: string; count?: number; onClick: () => void; primary?: boolean }) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${primary ? 'bg-white text-red-600 hover:bg-red-50' : 'bg-white/20 text-white hover:bg-white/30'}`}>
    <div className="flex items-center gap-2">
      <I className="w-4 h-4" />
      <span>{label}</span>
    </div>
    {count !== undefined && <span className={`text-xs px-1.5 py-0.5 rounded-full ${primary ? 'bg-red-100 text-red-600' : 'bg-white/30'}`}>{count}</span>}
  </button>
);

const Skeleton = ({ count }: { count: number }) => <>{Array.from({ length: count }).map((_, i) => <div key={i} className="flex gap-2 p-3 animate-pulse"><div className="w-7 h-7 rounded bg-red-100 dark:bg-red-900/20" /><div className="flex-1 space-y-1"><div className="h-3 bg-gray-100 dark:bg-neutral-700 rounded w-3/4" /><div className="h-2 bg-gray-100 dark:bg-neutral-700 rounded w-1/2" /></div></div>)}</>;

const ErrorView = ({ error, onRetry, t, isDark }: { error: string; onRetry: () => void; t: T; isDark: boolean }) => (
  <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-neutral-900' : 'bg-gray-50'}`}>
    <div className="text-center p-6">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
      <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{error}</p>
      <button onClick={onRetry} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">{t('button.retry')}</button>
    </div>
  </div>
);

const timeAgo = (d: string) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 60) return `${m}p`; const h = Math.floor(m / 60); if (h < 24) return `${h}h`; return `${Math.floor(h / 24)}d`; };

const donutOptions = (total: number, t: T, dark: boolean): ApexOptions => ({
  chart: { type: 'donut', background: 'transparent' },
  colors: ['#dc2626', '#ef4444', '#f87171', '#fca5a5'],
  labels: [t('incident.critical'), t('incident.high'), t('incident.medium'), t('incident.low')],
  dataLabels: { enabled: false },
  legend: { position: 'bottom', labels: { colors: dark ? '#9ca3af' : '#6b7280' }, fontSize: '10px' },
  plotOptions: { pie: { donut: { size: '65%', labels: { show: true, total: { show: true, label: 'Tổng', fontSize: '10px', color: dark ? '#9ca3af' : '#6b7280', formatter: () => String(total) }, value: { fontSize: '18px', fontWeight: 700, color: dark ? '#fff' : '#111' } } } } },
  stroke: { show: false },
  tooltip: { theme: dark ? 'dark' : 'light' },
});

const barOptions = (data: any[], dark: boolean): ApexOptions => ({
  chart: { type: 'bar', background: 'transparent', toolbar: { show: false } },
  colors: ['#dc2626'],
  plotOptions: { bar: { horizontal: false, columnWidth: '50%', borderRadius: 4 } },
  dataLabels: { enabled: true, formatter: (v: number) => `${v}%`, style: { fontSize: '10px', colors: [dark ? '#9ca3af' : '#6b7280'] }, offsetY: -16 },
  xaxis: {
    categories: data.slice(0, 5).map(d => d.department_name ? d.department_name.substring(0, 8) : 'N/A'),
    labels: { style: { colors: dark ? '#9ca3af' : '#6b7280', fontSize: '10px' } },
    axisBorder: { show: false },
    axisTicks: { show: false }
  },
  yaxis: { max: 100, labels: { show: false } },
  grid: { borderColor: dark ? 'rgba(156,163,175,0.1)' : 'rgba(107,114,128,0.1)', strokeDashArray: 3, padding: { left: 0, right: 0 } },
  tooltip: { theme: dark ? 'dark' : 'light' },
});
