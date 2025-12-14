import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import LineChartOne from "../../components/charts/line/LineChartOne";
import PageMeta from "../../components/common/PageMeta";
import { useTranslation } from "../../contexts/LanguageContext";

export default function LineChart() {
  const { t } = useTranslation();
  
  return (
    <div className="p-4">
      <PageMeta
        title={`${t('page.line_chart')} | SmartFactory CONNECT`}
        description={t('page.line_chart')}
      />
      <PageBreadcrumb pageTitle={t('page.line_chart')} />
      <div className="space-y-6">
        <ComponentCard title="Line Chart 1">
          <LineChartOne />
        </ComponentCard>
      </div>
    </div>
  );
}
