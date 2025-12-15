/**
 * Enterprise Dashboard - SmartFactory CONNECT
 * Modularized version with components and hooks
 */
import { useNavigate } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import Chart from 'react-apexcharts';
import { 
  AlertIcon, 
  BoxIcon, 
  CheckCircleIcon, 
  GroupIcon, 
  TimeIcon,
  CalenderIcon,
  FileIcon,
  ArrowRightIcon
} from '../../icons';
import { useTranslation } from '../../contexts/LanguageContext';

// Components and hooks
import { StatCard, QuickActionButton, ActivityItem, getPriorityChartOptions, getDepartmentChartOptions } from './components';
import { useDashboardData, computeDashboardValues } from './hooks';

export default function EnterpriseDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { summary, incidentStats, departmentStats, activities, loading, error, refetch } = useDashboardData();
  const values = computeDashboardValues(summary);

  // Priority chart data
  const priorityData = incidentStats?.by_priority 
    ? [
        incidentStats.by_priority.critical || 0,
        incidentStats.by_priority.high || 0,
        incidentStats.by_priority.medium || 0,
        incidentStats.by_priority.low || 0,
      ]
    : [0, 0, 0, 0];

  if (error) {
    return <ErrorView error={error} onRetry={refetch} t={t} />;
  }

  return (
    <>
      <PageMeta title="Dashboard | SmartFactory CONNECT" description={t('dashboard.overview')} />

      <div className="p-4 space-y-4 pb-4">
        {/* Header */}
        <DashboardHeader loading={loading} onRefresh={refetch} t={t} />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t('dashboard.pending_incidents')}
            value={values.pendingIncidents}
            subtitle={t('dashboard.need_action')}
            icon={AlertIcon}
            trend={values.totalIncidents > 0 ? { value: 12, isUp: false } : undefined}
            onClick={() => navigate('/error-report/all')}
            accent="red"
          />
          <StatCard
            title={t('dashboard.completion_rate')}
            value={`${values.resolutionRate}%`}
            subtitle={`${values.resolvedIncidents}/${values.totalIncidents} ${t('incident.incidents')}`}
            icon={CheckCircleIcon}
            trend={{ value: 5, isUp: true }}
            accent="gray"
          />
          <StatCard
            title={t('dashboard.contributions')}
            value={values.pendingIdeas}
            subtitle={t('dashboard.pending_review')}
            icon={BoxIcon}
            onClick={() => navigate('/feedback/public')}
            accent="gray"
          />
          <StatCard
            title={t('dashboard.online_employees')}
            value={values.activeUsers}
            subtitle={t('dashboard.active')}
            icon={GroupIcon}
            accent="gray"
          />
        </div>

        {/* Quick Actions */}
        <QuickActionsSection navigate={navigate} t={t} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activities */}
          <ActivitiesSection activities={activities} loading={loading} navigate={navigate} t={t} />

          {/* Priority Chart */}
          <ChartSection title={t('dashboard.priority_distribution')} loading={loading}>
            <Chart
              options={getPriorityChartOptions(values.totalIncidents)}
              series={priorityData}
              type="donut"
              height={280}
            />
          </ChartSection>
        </div>

        {/* Department Performance */}
        <DepartmentPerformanceSection departmentStats={departmentStats} loading={loading} t={t} />

        {/* Summary Stats */}
        <SummaryStatsSection values={values} t={t} />
      </div>
    </>
  );
}

// Type for translation function
type TranslateFunction = (key: string) => string;

// Sub-components
const ErrorView = ({ error, onRetry, t }: { error: string; onRetry: () => void; t: TranslateFunction }) => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <AlertIcon className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('error.occurred')}</h3>
      <p className="text-gray-500 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
      >
        {t('button.retry')}
      </button>
    </div>
  </div>
);

const DashboardHeader = ({ loading, onRefresh, t }: { loading: boolean; onRefresh: () => void; t: TranslateFunction }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl p-6 border border-gray-100">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{t('menu.dashboard')}</h1>
      <p className="text-gray-500 mt-1">
        {t('dashboard.overview')} • {new Date().toLocaleDateString('en-GB')}
      </p>
    </div>
    <button
      onClick={onRefresh}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <TimeIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      {t('button.refresh')}
    </button>
  </div>
);

const QuickActionsSection = ({ navigate, t }: { navigate: (path: string) => void; t: TranslateFunction }) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.quick_actions')}</h2>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <QuickActionButton icon={AlertIcon} label={t('dashboard.report_incident')} onClick={() => navigate('/error-report/create')} />
      <QuickActionButton icon={BoxIcon} label={t('dashboard.submit_feedback')} onClick={() => navigate('/feedback/submit')} />
      <QuickActionButton icon={CalenderIcon} label={t('dashboard.book_room')} onClick={() => navigate('/room-booking')} />
      <QuickActionButton icon={FileIcon} label={t('dashboard.view_news')} onClick={() => navigate('/news')} />
    </div>
  </div>
);

const ActivitiesSection = ({ activities, loading, navigate, t }: { activities: any[]; loading: boolean; navigate: (path: string) => void; t: TranslateFunction }) => (
  <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.recent_activities')}</h2>
      <button onClick={() => navigate('/activities')} className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
        {t('button.view_all')}
        <ArrowRightIcon className="w-4 h-4" />
      </button>
    </div>
    {loading ? (
      <LoadingPlaceholder count={4} />
    ) : activities.length > 0 ? (
      <div className="space-y-1">
        {activities.slice(0, 6).map(activity => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    ) : (
      <div className="text-center py-8 text-gray-500">{t('common.no_activities')}</div>
    )}
  </div>
);

const ChartSection = ({ title, loading, children }: { title: string; loading: boolean; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
    {loading ? (
      <div className="h-[280px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
      </div>
    ) : children}
  </div>
);

const DepartmentPerformanceSection = ({ departmentStats, loading, t }: { departmentStats: any[]; loading: boolean; t: TranslateFunction }) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.department_performance')}</h2>
    {loading ? (
      <div className="h-[250px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
      </div>
    ) : departmentStats.length > 0 ? (
      <Chart
        options={getDepartmentChartOptions(departmentStats)}
        series={[{ name: 'KPI', data: departmentStats.slice(0, 5).map(d => d.kpi_percentage) }]}
        type="bar"
        height={250}
      />
    ) : (
      <div className="h-[250px] flex items-center justify-center text-gray-500">{t('common.no_department_data')}</div>
    )}
  </div>
);

const SummaryStatsSection = ({ values, t }: { values: ReturnType<typeof computeDashboardValues>; t: TranslateFunction }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <div className="bg-red-600 rounded-2xl p-5 text-white">
      <p className="text-red-100 text-sm font-medium">{t('dashboard.total_incidents')}</p>
      <p className="text-3xl font-bold mt-1">{values.totalIncidents}</p>
    </div>
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <p className="text-gray-500 text-sm font-medium">{t('dashboard.resolved')}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{values.resolvedIncidents}</p>
    </div>
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <p className="text-gray-500 text-sm font-medium">{t('dashboard.feedback_ideas')}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{values.totalIdeas}</p>
    </div>
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <p className="text-gray-500 text-sm font-medium">{t('dashboard.departments')}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{values.departmentsCount}</p>
    </div>
  </div>
);

const LoadingPlaceholder = ({ count }: { count: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="animate-pulse flex gap-3 p-3">
        <div className="w-9 h-9 rounded-lg bg-gray-100" />
        <div className="flex-1">
          <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    ))}
  </div>
);
