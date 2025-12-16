import { useState, useEffect, useCallback } from "react";
import { useSocketRefresh } from "../../hooks/useSocket";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import api from "../../services/api";

interface TrendData {
    date: string;
    count: number;
}

export default function IncidentTrendChart() {
    const [dates, setDates] = useState<string[]>([]);
    const [counts, setCounts] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTrendData = useCallback(async () => {
        try {
            const res = await api.get('/dashboard/incidents/stats');
            const dailyTrend: TrendData[] = res.data?.data?.daily_trend || [];

            if (dailyTrend.length > 0) {
                const sorted = [...dailyTrend].sort((a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                );

                const formattedDates = sorted.map(item => {
                    const date = new Date(item.date);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                });

                setDates(formattedDates);
                setCounts(sorted.map(item => parseInt(String(item.count))));
            }
        } catch (error) {
            console.error("Failed to fetch trend data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrendData();
    }, [fetchTrendData]);

    // Real-time updates
    useSocketRefresh(['incident_created', 'incident_updated'], fetchTrendData, ['incidents']);

    const options: ApexOptions = {
        chart: {
            fontFamily: "Outfit, sans-serif",
            type: "area",
            height: 310,
            toolbar: {
                show: false,
            },
            zoom: {
                enabled: false,
            },
        },
        colors: ["#dc2626"],
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.5,
                opacityTo: 0.1,
                stops: [0, 90, 100],
            },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            curve: "smooth",
            width: 2,
        },
        grid: {
            borderColor: "#e7e7e7",
            strokeDashArray: 3,
            yaxis: {
                lines: {
                    show: true,
                },
            },
        },
        xaxis: {
            categories: dates,
            labels: {
                style: {
                    colors: "#6B7280",
                    fontSize: "12px",
                },
                rotate: -45,
                rotateAlways: dates.length > 15,
            },
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
        },
        yaxis: {
            title: {
                text: "Số sự cố",
                style: {
                    color: "#6B7280",
                    fontSize: "12px",
                },
            },
            labels: {
                style: {
                    colors: "#6B7280",
                },
                formatter: (val) => Math.round(val).toString(),
            },
        },
        tooltip: {
            theme: "light",
            x: {
                show: true,
            },
            y: {
                formatter: (val) => `${val} sự cố`,
            },
        },
        markers: {
            size: 4,
            colors: ["#dc2626"],
            strokeColors: "#fff",
            strokeWidth: 2,
            hover: {
                size: 6,
            },
        },
    };

    const series = [
        {
            name: "Sự cố",
            data: counts,
        },
    ];

    if (loading) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4 dark:bg-gray-700"></div>
                <div className="h-[310px] bg-gray-100 rounded dark:bg-gray-800"></div>
            </div>
        );
    }

    const hasData = counts.length > 0 && counts.some(c => c > 0);
    const totalIncidents = counts.reduce((a, b) => a + b, 0);
    const avgPerDay = counts.length > 0 ? (totalIncidents / counts.length).toFixed(1) : 0;

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Xu hướng sự cố (30 ngày)
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Tổng: {totalIncidents} | Trung bình: {avgPerDay}/ngày
                    </p>
                </div>
            </div>

            {hasData ? (
                <Chart options={options} series={series} type="area" height={310} />
            ) : (
                <div className="flex items-center justify-center h-[310px] text-gray-500 dark:text-gray-400">
                    Chưa có dữ liệu xu hướng
                </div>
            )}
        </div>
    );
}
