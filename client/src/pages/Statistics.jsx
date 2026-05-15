import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";

const api_url = "https://job-tracker-ya9s.onrender.com/api";

const getAuthHeader = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${sessionStorage.getItem("token")}`
});

const Statistics = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [barChartData, setBarChartData] = useState(null);
  const [pieChartData, setPieChartData] = useState(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPieJobs, setTotalPieJobs] = useState(0);

  let picker = searchParams.get("picker") || "year";
  let filter = searchParams.get("filter") || new Date().getFullYear();

  const updateParams = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    if (key === "picker") {
      newParams.set("filter", value === "year" ? new Date().getFullYear() : "");
    }
    setSearchParams(newParams);
  };

  useEffect(() => {
    generateBarChartData();
    generatePieChartData();
  }, [filter]);

  const getBarChartData = async () => {
    const query = new URLSearchParams({ picker, filter }).toString();
    try {
      const response = await fetch(`${api_url}/chart/bar?${query}`, { method: "GET", headers: getAuthHeader() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to get bar chart data");
      return data;
    } catch (err) { console.error(err); return []; }
  };

  const getPiechartData = async () => {
    const query = new URLSearchParams({ picker, filter }).toString();
    try {
      const response = await fetch(`${api_url}/chart/pie?${query}`, { method: "GET", headers: getAuthHeader() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to get pie chart data");
      return data;
    } catch (err) { console.error(err); return []; }
  };

  const generateBarChartData = async () => {
    const labels = picker === "year"
      ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      : Array.from({ length: 30 }, (_, i) => i + 1);
    const data = await getBarChartData();
    if (!data?.length) return;
    setTotalJobs(data.reduce((sum, val) => sum + val, 0));
    setBarChartData({
      labels,
      datasets: [{
        data,
        backgroundColor: "rgb(17 24 39 / 0.08)",
        borderColor: "rgb(17 24 39 / 0.7)",
        borderWidth: 1,
        borderRadius: 4,
      }],
    });
  };

  const generatePieChartData = async () => {
    const categories = ["Saved", "Applied", "Pending", "Rejected", "Accepted"];
    const data = await getPiechartData();
    if (!data?.length) return;
    setTotalPieJobs(data.reduce((sum, val) => sum + val, 0));
    setPieChartData({
      labels: categories,
      datasets: [{
        data,
        backgroundColor: [
          "rgb(209 213 219)",   // gray   — Saved
          "rgb(191 219 254)",   // blue   — Applied
          "rgb(254 240 138)",   // yellow — Pending
          "rgb(254 202 202)",   // red    — Rejected
          "rgb(187 247 208)",   // green  — Accepted
        ],
        borderWidth: 0,
      }],
    });
  };

  const chartOptions = {
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: "#9ca3af", font: { size: 11 } } },
      y: { grid: { color: "rgb(243 244 246)" }, border: { display: false }, ticks: { color: "#9ca3af", font: { size: 11 } } },
    },
  };

  const pieOptions = {
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  const pieCategories = [
    { label: "Saved",    color: "bg-gray-200"   },
    { label: "Applied",  color: "bg-blue-200"   },
    { label: "Pending",  color: "bg-yellow-200" },
    { label: "Rejected", color: "bg-red-200"    },
    { label: "Accepted", color: "bg-green-200"  },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-8">

      {/* Page header + controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-medium text-gray-900">Statistics</h1>
          <p className="text-xs text-gray-400 mt-0.5">Track your application activity over time</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={picker}
            onChange={(e) => updateParams("picker", e.target.value)}
            className="text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white text-gray-700 cursor-pointer"
          >
            <option value="year">Year</option>
            <option value="month">Month</option>
            <option value="date">Date</option>
          </select>

          {picker === "year" && (
            <input
              type="number"
              value={filter}
              onChange={(e) => updateParams("filter", e.target.value)}
              className="text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 w-24 bg-white text-gray-700"
            />
          )}
          {picker === "month" && (
            <input
              type="month"
              value={filter}
              onChange={(e) => updateParams("filter", e.target.value)}
              className="text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white text-gray-700"
            />
          )}
          {picker === "date" && (
            <input
              type="date"
              value={filter}
              onChange={(e) => updateParams("filter", e.target.value)}
              className="text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white text-gray-700"
            />
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-5">

        {/* Bar chart — 2/3 width */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl px-6 py-5">
          <div className="flex items-baseline justify-between mb-5">
            <p className="text-sm font-medium text-gray-800">Jobs applied in {filter}</p>
            <span className="text-xs text-gray-400">{totalJobs} total</span>
          </div>
          {barChartData ? (
            <Bar data={barChartData} options={chartOptions} />
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-300">No data available</div>
          )}
        </div>

        {/* Pie chart — 1/3 width */}
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5">
          <div className="flex items-baseline justify-between mb-5">
            <p className="text-sm font-medium text-gray-800">Breakdown</p>
            <span className="text-xs text-gray-400">{totalPieJobs} total</span>
          </div>
          {pieChartData ? (
            <>
              <Pie data={pieChartData} options={pieOptions} />
              {/* Legend */}
              <div className="mt-8 grid grid-cols-3 gap-x-3 gap-y-2">
                {pieCategories.map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-sm shrink-0 ${color}`} />
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-300">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;