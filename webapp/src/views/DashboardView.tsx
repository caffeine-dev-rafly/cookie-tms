import { Layers, Package, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function DashboardView() {
  const trendRef = useRef<HTMLCanvasElement | null>(null);
  const costRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const trendCtx = trendRef.current?.getContext("2d");
    const costCtx = costRef.current?.getContext("2d");

    const trendChart = trendCtx
      ? new Chart(trendCtx, {
          type: "line",
          data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            datasets: [
              {
                label: "Volume",
                data: [120, 190, 150, 250, 220, 300],
                borderColor: "#6A9C78",
                backgroundColor: "rgba(106, 156, 120, 0.1)",
                fill: true,
                tension: 0.4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
          },
        })
      : null;

    const costChart = costCtx
      ? new Chart(costCtx, {
          type: "bar",
          data: {
            labels: ["Fuel", "Maint", "Labor", "Tolls"],
            datasets: [
              {
                label: "Actual",
                data: [4500, 1200, 8000, 600],
                backgroundColor: "#6A9C78",
              },
              {
                label: "Budget",
                data: [5000, 1000, 7800, 500],
                backgroundColor: "#E8EFE9",
              },
            ],
          },
          options: { responsive: true, maintainAspectRatio: false },
        })
      : null;

    return () => {
      trendChart?.destroy();
      costChart?.destroy();
    };
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-bold text-matcha-600 uppercase mb-3 tracking-wide">
          Operational KPIs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-card border border-matcha-50 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">On-Time Delivery</p>
              <h3 className="text-2xl font-bold text-matcha-900">98.5%</h3>
              <span className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Up 1.2% vs last mo
              </span>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-card border border-matcha-50 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Active Shipments</p>
              <h3 className="text-2xl font-bold text-matcha-900">142</h3>
              <span className="text-[10px] text-matcha-500">45 In Transit</span>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-card border border-matcha-50 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Volume</p>
              <h3 className="text-2xl font-bold text-matcha-900">12.4k</h3>
              <span className="text-[10px] text-gray-400">Units this month</span>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-matcha-600 uppercase mb-3 tracking-wide">
          Financial Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-card border border-matcha-50 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Revenue (MTD)</p>
              <h3 className="text-2xl font-bold text-matcha-900">$425k</h3>
            </div>
            <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600">
              $
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-card border border-matcha-50 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Cost per Mile</p>
              <h3 className="text-2xl font-bold text-matcha-900">$2.10</h3>
              <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Down 2% this month
              </span>
            </div>
            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-card border border-matcha-50 flex flex-col justify-center h-full">
            <div className="flex justify-between text-xs mb-2">
              <span>Fuel Budget</span>
              <span className="font-bold">85% Used</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full">
              <div className="bg-matcha-500 h-2 rounded-full" style={{ width: "85%" }} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-card border border-matcha-50">
          <h4 className="font-bold text-sm text-matcha-900 mb-4">
            Monthly Delivery Trends
          </h4>
          <div className="h-60">
            <canvas ref={trendRef} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-card border border-matcha-50">
          <h4 className="font-bold text-sm text-matcha-900 mb-4">
            Cost Analysis vs Budget
          </h4>
          <div className="h-60">
            <canvas ref={costRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
