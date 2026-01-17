import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Loader2 } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import api from "../../services/api";

export default function FeedbackRatingChart() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{labels: string[], series: number[]}>({
    labels: [
      t('feedback_dashboard.rating.very_satisfied'),
      t('feedback_dashboard.rating.satisfied'),
      t('feedback_dashboard.rating.acceptable'),
      t('feedback_dashboard.rating.unsatisfied')
    ],
    series: [0, 0, 0, 0]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard/ideas/stats');
        const satisfactionData = response.data.data.satisfaction;
        
        if (satisfactionData && Array.isArray(satisfactionData)) {
          const labelMap: Record<string, string> = {
            'very_satisfied': t('feedback_dashboard.rating.very_satisfied'),
            'satisfied': t('feedback_dashboard.rating.satisfied'),
            'acceptable': t('feedback_dashboard.rating.acceptable'),
            'unsatisfied': t('feedback_dashboard.rating.unsatisfied')
          };
          
          const labels = satisfactionData.map((item: any) => labelMap[item.satisfaction_level] || item.satisfaction_level);
          const series = satisfactionData.map((item: any) => parseInt(item.count) || 0);
          
          setChartData({ labels, series });
        }
      } catch (error) {
        console.error("Failed to fetch rating data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [t]);

  const colors: string[] = [
    "#e5386d",
    "#ff4d6d",
    "#ff8fa3",
    "#ffb3c1",
    "#ffccd5",
  ];
  const totalRatings = chartData.series.reduce((a, b) => a + b, 0);

  const [selectedSlice, setSelectedSlice] = useState<{
    index: number;
    label: string;
    value: number;
  } | null>(null);

  const options: ApexOptions = {
    labels: chartData.labels,
    colors,
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
      events: {
        click: (event, chartContext, config) => {
          if (config.dataPointIndex === -1) setSelectedSlice(null);
        },
        dataPointSelection: (event, chartContext, config) => {
          const clickedIndex = config.dataPointIndex;
          setSelectedSlice((current) => {
            if (current && current.index === clickedIndex) return null;
            return {
              index: clickedIndex,
              label: chartData.labels[clickedIndex],
              value: chartData.series[clickedIndex],
            };
          });
        },
      },
    },
    tooltip: { enabled: false },
    plotOptions: {
      pie: {
        donut: { size: "60%", labels: { show: false } },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${Number(val).toFixed(0)}%`,
      style: {
        colors: ["#ffffff"],
        fontSize: "14px",
        fontWeight: "bold",
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 2,
        color: "#000000",
        opacity: 0.45,
      },
    },
    stroke: { width: 3, colors: ["#ffffff"] },
    legend: {
      position: "bottom",
      fontSize: "14px",
      markers: { width: 10, height: 10, radius: 5, fillColors: colors },
      itemMargin: { horizontal: 10, vertical: 5 },
    },
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900 h-full flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (totalRatings === 0) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900 h-full">
        <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
          {t('feedback_dashboard.rating_chart.title')}
        </h3>
        <div className="flex items-center justify-center min-h-[300px] text-gray-500 dark:text-gray-400">
          {t('feedback_dashboard.no_data', 'Chưa có dữ liệu đánh giá')}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900 h-full">
      <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
        {t('feedback_dashboard.rating_chart.title')}
      </h3>

      <div className="relative flex items-center justify-center">
        <Chart options={options} series={chartData.series} type="donut" height={320} />

        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center -translate-y-8"
        >
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {selectedSlice ? selectedSlice.label : t('feedback_dashboard.rating_chart.total')}
          </p>

          <h2 className="bg-gradient-to-r from-[#c9184a] to-[#ff4d6d] bg-clip-text text-4xl font-extrabold text-transparent">
            {selectedSlice ? selectedSlice.value : totalRatings}
          </h2>
        </div>
      </div>
    </div>
  );
}
