import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import { useTranslation } from "../../contexts/LanguageContext";
import dashboardService, { IdeaDifficultyData } from "../../services/dashboard.service";

type ChartSeries = {
  name: string;
  data: number[];
}[];

export default function FeedbackDifficultyChart() {
  const { t } = useTranslation();
  const [data, setData] = useState<IdeaDifficultyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await dashboardService.getIdeaDifficultyDistribution();
        setData(response);
      } catch (err) {
        console.error('Failed to fetch idea difficulty:', err);
        setError(t('feedback_dashboard.error_loading', 'Không thể tải dữ liệu'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [t]);

  // Helper to translate categories
  const getTranslatedCategories = () => {
    if (!data?.categories) {
      return [
        t('feedback_dashboard.difficulty.easy'),
        t('feedback_dashboard.difficulty.medium'),
        t('feedback_dashboard.difficulty.hard'),
        t('feedback_dashboard.difficulty.very_hard')
      ];
    }
    
    // Try to map backend categories if they match keys
    return data.categories.map(cat => {
      const keyMap: Record<string, string> = {
        'easy': 'easy',
        'medium': 'medium',
        'hard': 'hard',
        'very_hard': 'very_hard',
        'Dễ': 'easy',
        'Trung bình': 'medium',
        'Khó': 'hard',
        'Rất khó': 'very_hard'
      };
      
      const key = keyMap[cat] || cat;
      // Check if it's one of our keys
      if (['easy', 'medium', 'hard', 'very_hard'].includes(key)) {
        return t(`feedback_dashboard.difficulty.${key}`);
      }
      return cat;
    });
  };

  const options: ApexOptions = {
    colors: ["#e5386d"],
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "vertical",
        shadeIntensity: 0.5,
        gradientToColors: ["#ff8fa3"],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 350,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "45%",
        borderRadius: 6,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    grid: {
      borderColor: "#e7e7e7",
      yaxis: {
        lines: {
          show: true,
        },
      },
      xaxis: {
        lines: {
          show: false,
        },
      },
    },
    xaxis: {
      categories: getTranslatedCategories(),
      labels: {
        style: {
          colors: "#6B7280",
        },
      },
    },
    yaxis: {
      title: {
        text: t('feedback_dashboard.difficulty_chart.y_axis'),
        style: {
          color: "#6B7280",
        },
      },
      labels: {
        style: {
          colors: "#6B7280",
        },
      },
    },
    tooltip: {
      theme: "light",
      y: {
        formatter: function (val: number) {
          return val + " " + t('feedback_dashboard.difficulty_chart.tooltip_unit');
        },
      },
    },
  };

  const series: ChartSeries = [
    {
      name: t('feedback_dashboard.difficulty_chart.series_name'),
      data: data?.counts || [],
    },
  ];

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
          {t('feedback_dashboard.difficulty_chart.title')}
        </h3>
        <div className="flex items-center justify-center h-[350px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
          {t('feedback_dashboard.difficulty_chart.title')}
        </h3>
        <div className="flex items-center justify-center h-[350px] text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
        {t('feedback_dashboard.difficulty_chart.title')}
      </h3>
      <div>
        <Chart options={options} series={series} type="bar" height={350} />
      </div>
    </div>
  );
}
