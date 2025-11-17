import PageMeta from "../../components/common/PageMeta";
import IncidentOverview from "../../components/chart-incident-report/IncidentOverview";
import IncidentTypePieChart from "../../components/chart-incident-report/IncidentTypePieChart";
import TopMachinesBarChart from "../../components/chart-incident-report/TopMachinesBarChart";
import DepartmentKPIChart from "../../components/chart-incident-report/DepartmentKPIChart";
import ResponseTimeCard from "../../components/chart-incident-report/ResponseTimeCard";
import ResolveTimeCard from "../../components/chart-incident-report/ResolveTimeCard";
import AvgTimeStats from "../../components/chart-incident-report/AvgTimeStats";

export default function IncidentDashboard() {
  return (
    <>
      <PageMeta
        title="Factory Incident Dashboard"
        description="Dashboard hiển thị thống kê sự cố nhà máy"
      />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* 1. Tổng quan */}
        <div className="col-span-12 xl:col-span-7 space-y-6">
          <IncidentOverview />
          <IncidentTypePieChart />
        </div>

        {/* 2. KPI và thời gian */}
        <div className="col-span-12 xl:col-span-5 space-y-6">
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
