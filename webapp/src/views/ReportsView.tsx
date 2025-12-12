import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";

export default function ReportsView() {
  const [range, setRange] = useState<"6m" | "12m" | "ytd">("6m");
  const onTimeRef = useRef<HTMLCanvasElement | null>(null);
  const financeRef = useRef<HTMLCanvasElement | null>(null);
  const fuelRef = useRef<HTMLCanvasElement | null>(null);
  const carrierRef = useRef<HTMLCanvasElement | null>(null);

  const rangeConfig = useMemo(
    () => ({
      "6m": {
        labels: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        onTime: [94, 95, 96, 95.5, 97, 98.5],
        revenue: [300, 450, 420, 500, 520, 540],
        cost: [250, 380, 360, 410, 430, 440],
        fuel: [1200, 1350, 1250, 1400, 1420, 1450],
        carriers: [98, 95, 92, 94],
      },
      "12m": {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        onTime: [93, 93.5, 94, 94.5, 95, 95.5, 96, 96.5, 97, 97.5, 98, 98.5],
        revenue: [180, 210, 240, 260, 280, 300, 320, 340, 360, 380, 410, 440],
        cost: [140, 170, 190, 210, 230, 250, 270, 285, 300, 315, 330, 350],
        fuel: [900, 950, 980, 1020, 1100, 1150, 1200, 1250, 1300, 1320, 1370, 1400],
        carriers: [98, 95, 92, 94],
      },
      ytd: {
        labels: ["Q1", "Q2", "Q3", "Q4"],
        onTime: [94, 95, 96, 97],
        revenue: [700, 900, 1100, 1300],
        cost: [580, 720, 880, 1000],
        fuel: [3000, 3100, 3300, 3400],
        carriers: [98, 95, 92, 94],
      },
    }),
    []
  );

  useEffect(() => {
    const charts: Chart[] = [];

    const config = rangeConfig[range];

    if (onTimeRef.current) {
      const ctx = onTimeRef.current.getContext("2d");
      if (ctx) {
        charts.push(
          new Chart(ctx, {
            type: "line",
            data: {
              labels: config.labels,
              datasets: [
                {
                  label: "On-Time %",
                  data: config.onTime,
                  borderColor: "#6A9C78",
                  borderWidth: 2,
                  tension: 0.3,
                  pointBackgroundColor: "#fff",
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: { y: { min: 90, max: 100 } },
            },
          })
        );
      }
    }

    if (financeRef.current) {
      const ctx = financeRef.current.getContext("2d");
      if (ctx) {
        charts.push(
          new Chart(ctx, {
            type: "bar",
            data: {
              labels: config.labels,
              datasets: [
                { label: "Revenue", data: config.revenue, backgroundColor: "#6A9C78" },
                { label: "Cost", data: config.cost, backgroundColor: "#E8EFE9" },
              ],
            },
            options: { responsive: true, maintainAspectRatio: false },
          })
        );
      }
    }

    if (fuelRef.current) {
      const ctx = fuelRef.current.getContext("2d");
      if (ctx) {
        charts.push(
          new Chart(ctx, {
            type: "line",
            data: {
              labels: config.labels,
              datasets: [
                {
                  label: "Consumption (L)",
                  data: config.fuel,
                  borderColor: "#F6AD55",
                  backgroundColor: "rgba(246, 173, 85, 0.1)",
                  fill: true,
                },
              ],
            },
            options: { responsive: true, maintainAspectRatio: false },
          })
        );
      }
    }

    if (carrierRef.current) {
      const ctx = carrierRef.current.getContext("2d");
      if (ctx) {
        charts.push(
          new Chart(ctx, {
            type: "bar",
            indexAxis: "y",
            data: {
              labels: ["GreenLine Fleet", "Global Freight", "DHL", "FedEx"],
              datasets: [
                {
                  label: "Reliability Score",
                  data: config.carriers,
                  backgroundColor: ["#6A9C78", "#AECBB2", "#CBD5E0", "#AECBB2"],
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: { x: { min: 80, max: 100 } },
            },
          })
        );
      }
    }

    return () => charts.forEach((chart) => chart.destroy());
  }, [range, rangeConfig]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-matcha-900">Analytics & Reporting</h3>
          <p className="text-xs text-matcha-500">Comprehensive operational insights.</p>
        </div>
        <div className="flex gap-2">
          <select
            className="bg-white border border-matcha-200 text-xs rounded-lg px-3 py-2"
            value={range}
            onChange={(e) => setRange(e.target.value as typeof range)}
          >
            <option value="6m">Last 6 Months</option>
            <option value="12m">Last 12 Months</option>
            <option value="ytd">Year to Date (Qtrs)</option>
          </select>
          <button className="bg-matcha-600 text-white text-xs font-bold px-4 py-2 rounded-lg">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-card border border-matcha-50 text-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase">Total Spend</p>
          <h3 className="text-2xl font-bold text-matcha-900">$1.2M</h3>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-card border border-matcha-50 text-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase">Avg OTP</p>
          <h3 className="text-2xl font-bold text-green-600">98.2%</h3>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-card border border-matcha-50 text-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase">Fuel Usage</p>
          <h3 className="text-2xl font-bold text-orange-500">45k L</h3>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-card border border-matcha-50 text-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase">CO2 Emissions</p>
          <h3 className="text-2xl font-bold text-gray-700">120 T</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-card border border-matcha-50">
          <h4 className="font-bold text-sm text-matcha-900 mb-4">Monthly Delivery Trends</h4>
          <div className="h-64">
            <canvas ref={onTimeRef} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-card border border-matcha-50">
          <h4 className="font-bold text-sm text-matcha-900 mb-4">
            Financial Performance (Revenue vs Cost)
          </h4>
          <div className="h-64">
            <canvas ref={financeRef} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-card border border-matcha-50">
          <h4 className="font-bold text-sm text-matcha-900 mb-4">Fuel Consumption & Cost</h4>
          <div className="h-64">
            <canvas ref={fuelRef} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-card border border-matcha-50">
          <h4 className="font-bold text-sm text-matcha-900 mb-4">Carrier Performance Ranking</h4>
          <div className="h-64">
            <canvas ref={carrierRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
