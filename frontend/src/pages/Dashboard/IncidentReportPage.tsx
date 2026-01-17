import PageMeta from "../../components/common/PageMeta";
import IncidentOverview from "../../components/chart-incident-report/IncidentOverview";
import IncidentTypePieChart from "../../components/chart-incident-report/IncidentTypePieChart";
import TopMachinesBarChart from "../../components/chart-incident-report/TopMachinesBarChart";
import DepartmentKPIChart from "../../components/chart-incident-report/DepartmentKPIChart";
import ResponseTimeCard from "../../components/chart-incident-report/ResponseTimeCard";
import ResolveTimeCard from "../../components/chart-incident-report/ResolveTimeCard";
import AvgTimeStats from "../../components/chart-incident-report/AvgTimeStats";
import { useTranslation } from "../../contexts/LanguageContext";
export default function IncidentDashboard() {
  const { t } = useTranslation();

  return (
    <>
      <PageMeta
        title={t('incident_report.title')}
        description={t('incident_report.description')}
      />

      <div className="p-4 grid grid-cols-12 gap-4">
        {/* 1. Tổng quan */}
        <div className="col-span-12 xl:col-span-7 space-y-4">
          <IncidentOverview />
          <IncidentTypePieChart />
        </div>

        {/* 2. KPI và thời gian */}
        <div className="col-span-12 xl:col-span-5 space-y-4">
          <AvgTimeStats />
          <ResponseTimeCard />
          <ResolveTimeCard />
        </div>

        {/* 3. Top máy lỗi */}
        <div className="col-span-12">
          <TopMachinesBarChart />
        </div>

        {/* 4. KPI phòng ban */}
        <div className="col-span-12">
          <DepartmentKPIChart />
        </div>
      </div>
    </>
  );
}
