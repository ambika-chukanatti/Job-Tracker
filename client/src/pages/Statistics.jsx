import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";
import Alert from "../components/Alert";

const api_url = "https://job-tracker-ya9s.onrender.com/api";

const getAuthHeader = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${sessionStorage.getItem("token")}`
});

// Follows the "dark" class on <html>, the same switch Tailwind's dark: classes use
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains("dark"))
    );
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
};

const pieLabels = ["Saved", "Applied", "Pending", "Rejected", "Accepted"];

const chartThemes = {
  light: {
    barFill: "rgb(17 24 39 / 0.08)",
    barLine: "rgb(17 24 39 / 0.7)",
    tick: "#6b7280",
    grid: "rgb(243 244 246)",
    tooltipBg: "#111827",
    pie: [
      "rgb(209 213 219)", // Saved    - gray
      "rgb(191 219 254)", // Applied  - blue
      "rgb(254 240 138)", // Pending  - yellow
      "rgb(254 202 202)", // Rejected - red
      "rgb(187 247 208)", // Accepted - green
    ],
  },
  dark: {
    barFill: "rgb(229 231 235 / 0.18)",
    barLine: "rgb(229 231 235 / 0.85)",
    tick: "#9ca3af",
    grid: "rgb(255 255 255 / 0.08)",
    tooltipBg: "#374151",
    pie: [
      "rgb(107 114 128)", // Saved
      "rgb(96 165 250)",  // Applied
      "rgb(250 204 21)",  // Pending
      "rgb(248 113 113)", // Rejected
      "rgb(74 222 128)",  // Accepted
    ],
  },
};

const controlClass =
  "text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-colors duration-200 " +
  "bg-white text-gray-700 border-gray-200 focus:ring-gray-300 " +
  "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:focus:ring-gray-500 dark:[color-scheme:dark]";

const cardClass =
  "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-6 py-5 transition-colors duration-200";

const Statistics = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [barValues, setBarValues] = useState(null);
  const [pieValues, setPieValues] = useState(null);
  const [error, setError] = useState("");
  const isDark = useDarkMode();
  const theme = isDark ? chartThemes.dark : chartThemes.light;

  const picker = searchParams.get("picker") || "year";
  const filter = searchParams.get("filter") || new Date().getFullYear();

  const updateParams = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    if (key === "picker") {
      newParams.set("filter", value === "year" ? new Date().getFullYear() : "");
    }
    setSearchParams(newParams);
  };

  // type is "bar" or "pie"; returns the numbers, or null if there's nothing to show
  const fetchChart = async (type) => {
    const query = new URLSearchParams({ picker, filter }).toString();
    try {
      const response = await fetch(`${api_url}/chart/${type}?${query}`, { headers: getAuthHeader() });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || `Failed to load the ${type} chart.`);
        return null;
      }
      return Array.isArray(data) && data.length ? data : null;
    } catch (err) {
      setError("Can't reach the server. Check your connection and try again.");
      return null;
    }
  };

  useEffect(() => {
    setError("");
    fetchChart("bar").then(setBarValues);
    fetchChart("pie").then(setPieValues);
  }, [picker, filter]);

  // Colors are applied here at render time, so they follow the theme
  const labels =
    picker === "year"
      ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      : Array.from({ length: 30 }, (_, i) => i + 1);

  const totalJobs = barValues ? barValues.reduce((sum, v) => sum + v, 0) : 0;
  const totalPieJobs = pieValues ? pieValues.reduce((sum, v) => sum + v, 0) : 0;

  const barChartData = barValues && {
    labels,
    datasets: [{
      data: barValues,
      backgroundColor: theme.barFill,
      borderColor: theme.barLine,
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const pieChartData = pieValues && {
    labels: pieLabels,
    datasets: [{
      data: pieValues,
      backgroundColor: theme.pie,
      borderWidth: 0,
    }],
  };

  const tooltip = {
    enabled: true,
    backgroundColor: theme.tooltipBg,
    titleColor: "#ffffff",
    bodyColor: "#ffffff",
  };

  const chartOptions = {
    plugins: { legend: { display: false }, tooltip },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: theme.tick, font: { size: 11 } } },
      y: { grid: { color: theme.grid }, border: { display: false }, ticks: { color: theme.tick, font: { size: 11 } } },
    },
  };

  const pieOptions = {
    plugins: { legend: { display: false }, tooltip },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-8 py-8 transition-colors duration-200">

      {error && (
        <div className="mb-4">
          <Alert onClose={() => setError("")}>{error}</Alert>
        </div>
      )}

      {/* Page header + controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-medium text-gray-900 dark:text-gray-100">Statistics</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Track your application activity over time</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={picker}
            onChange={(e) => updateParams("picker", e.target.value)}
            className={`${controlClass} cursor-pointer`}
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
              className={`${controlClass} w-24`}
            />
          )}
          {picker === "month" && (
            <input
              type="month"
              value={filter}
              onChange={(e) => updateParams("filter", e.target.value)}
              className={controlClass}
            />
          )}
          {picker === "date" && (
            <input
              type="date"
              value={filter}
              onChange={(e) => updateParams("filter", e.target.value)}
              className={controlClass}
            />
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-5">

        {/* Bar chart: 2/3 width */}
        <div className={`col-span-2 ${cardClass}`}>
          <div className="flex items-baseline justify-between mb-5">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Jobs applied in {filter}</p>
            <span className="text-xs text-gray-400 dark:text-gray-500">{totalJobs} total</span>
          </div>
          {barChartData ? (
            <Bar data={barChartData} options={chartOptions} />
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-300 dark:text-gray-600">No data available</div>
          )}
        </div>

        {/* Pie chart: 1/3 width */}
        <div className={cardClass}>
          <div className="flex items-baseline justify-between mb-5">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Breakdown</p>
            <span className="text-xs text-gray-400 dark:text-gray-500">{totalPieJobs} total</span>
          </div>
          {pieChartData ? (
            <>
              <Pie data={pieChartData} options={pieOptions} />
              {/* Legend: uses the same colors as the pie, so they always match */}
              <div className="mt-8 grid grid-cols-3 gap-x-3 gap-y-2">
                {pieLabels.map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: theme.pie[i] }} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-300 dark:text-gray-600">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;