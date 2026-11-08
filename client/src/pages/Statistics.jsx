import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";
import { useToast } from "../components/ToastContext"; // adjust path if needed

const api_url = "https://job-tracker-ya9s.onrender.com/api";

const getAuthHeader = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${sessionStorage.getItem("token")}`
});

// True when the page is inside a ".dark" element (wherever your toggle puts the class),
// which is the same rule Tailwind's dark: classes follow
const useDarkMode = (ref) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(!!ref.current?.closest(".dark"));
    check();

    // Watch class changes anywhere in the document (html, body, or a wrapper div)
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
      subtree: true,
    });
    return () => observer.disconnect();
  }, [ref]);

  return isDark;
};

const pieLabels = [
  "Bookmarked", "Applied", "No Response", "Not Selected",
  "I Withdrew", "Interviewing", "Negotiating", "Accepted",
];

const BAR_FILL = "rgba(99, 102, 241, 0.6)";
const BAR_LINE = "rgb(99, 102, 241)";
const GRID = "rgba(128, 128, 128, 0.15)";

const chartThemes = {
  light: {
    tick: "#6b7280",
    tooltipBg: "#111827",
    pie: ["#d1d5db", "#bfdbfe", "#fef08a", "#fecaca", "#fed7aa", "#e9d5ff", "#a5f3fc", "#bbf7d0"],
  },
  dark: {
    tick: "#9ca3af",
    tooltipBg: "#374151",
    pie: ["#6b7280", "#60a5fa", "#facc15", "#f87171", "#fb923c", "#c084fc", "#22d3ee", "#4ade80"],
  },
};

const controlClass =
  "text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-colors duration-200 " +
  "bg-white text-gray-700 border-gray-200 focus:ring-gray-300 " +
  "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:focus:ring-gray-500 dark:[color-scheme:dark]";

const cardClass =
  "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-6 py-5 transition-colors duration-200";

const Statistics = () => {
  const rootRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [barValues, setBarValues] = useState(null);
  const [pieValues, setPieValues] = useState(null);
  const toast = useToast();
  const isDark = useDarkMode(rootRef);
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

  // type is "bar" or "pie"; returns { values, error }
  // values is null when there's nothing to show
  const fetchChart = async (type) => {
    const query = new URLSearchParams({ picker, filter }).toString();
    try {
      const response = await fetch(`${api_url}/chart/${type}?${query}`, { headers: getAuthHeader() });
      const data = await response.json();
      if (!response.ok) {
        return { values: null, error: data.error || `Failed to load the ${type} chart.` };
      }
      return { values: Array.isArray(data) && data.length ? data : null, error: null };
    } catch (err) {
      return { values: null, error: "Can't reach the server. Check your connection and try again." };
    }
  };

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchChart("bar"), fetchChart("pie")]).then(([bar, pie]) => {
      if (cancelled) return; // ignore results from an outdated filter
      setBarValues(bar.values);
      setPieValues(pie.values);

      // One toast at most, even if both requests fail
      const err = bar.error || pie.error;
      if (err) toast.error(err);
    });

    return () => {
      cancelled = true;
    };
  }, [picker, filter]);

  let labels;
  if (picker === "year") {
    labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  } else if (picker === "month") {
    const [y, m] = filter.split("-").map(Number);
    labels = Array.from({ length: new Date(y, m, 0).getDate() }, (_, i) => i + 1);
  } else {
    labels = [filter];
  }

  const totalJobs = barValues ? barValues.reduce((sum, v) => sum + v, 0) : 0;
  const totalPieJobs = pieValues ? pieValues.reduce((sum, v) => sum + v, 0) : 0;

  const barChartData = barValues && {
    labels,
    datasets: [{
      data: barValues,
      backgroundColor: BAR_FILL,
      borderColor: BAR_LINE,
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
      y: { grid: { color: GRID }, border: { display: false }, ticks: { color: theme.tick, font: { size: 11 } } },
    },
  };

  const pieOptions = {
    plugins: { legend: { display: false }, tooltip },
  };

  return (
    <div ref={rootRef} className="min-h-screen bg-gray-50 dark:bg-gray-950 px-8 py-8 transition-colors duration-200">

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
            <Bar key={isDark ? "dark" : "light"} data={barChartData} options={chartOptions} />
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
              <Pie key={isDark ? "dark" : "light"} data={pieChartData} options={pieOptions} />
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