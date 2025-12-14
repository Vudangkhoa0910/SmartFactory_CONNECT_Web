import { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { getProcessingTimeByPriority, ProcessingTimeData } from "../../services/dashboard.service";

export default function DemographicCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ProcessingTimeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getProcessingTimeByPriority();
        setData(result);
      } catch (err) {
        console.error("Error fetching processing time:", err);
        // Fallback data
        setData({
          categories: ["Nghiêm trọng", "Cao", "Trung bình", "Thấp"],
          avgHours: [0, 0, 0, 0],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const options: ApexOptions = {
    colors: ["#DC2626"],
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
        columnWidth: "55%",
        borderRadius: 2,
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
    xaxis: {
      categories: data?.categories || ["Nghiêm trọng", "Cao", "Trung bình", "Thấp"],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        text: "Giờ",
        style: {
          fontSize: "16px",
          fontWeight: 600,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " giờ";
        },
      },
    },
    grid: {
      strokeDashArray: 5,
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
  };

  const series = [
    {
      name: "Thời gian xử lý",
      data: data?.avgHours || [0, 0, 0, 0],
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <div className="flex justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Thời gian xử lý sự cố
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Trung bình theo mức độ ưu tiên
          </p>
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              Xem thêm
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              Xóa
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="mb-2">
        <div id="chartFour" className="-ml-5">
          {loading ? (
            <div className="flex items-center justify-center h-[350px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          ) : (
            <Chart options={options} series={series} type="bar" height={350} />
          )}
        </div>
      </div>
    </div>
  );
}
