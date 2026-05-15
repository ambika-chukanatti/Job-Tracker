import React, { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
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

  const location = useLocation();

  let picker = searchParams.get("picker") || "year";
  let filter = searchParams.get("filter") || new Date().getFullYear();

  const updateParams = (key, value) => {
    const newParams = new URLSearchParams(searchParams);

    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }

    if (key === "picker") {
      if (value === "year") {
        newParams.set("filter", 2025);
      } else {
        newParams.set("filter", "");
      }
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
      const response = await fetch(`${api_url}/chart/bar?${query}`, {
        method: "GET",
        headers: getAuthHeader()  
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to get bar chart data");
      return data;
    } catch (err) {
      console.error(err);
      return [];  
    }
  };

  const getPiechartData = async () => {
    const query = new URLSearchParams({ picker, filter }).toString();
    try {
      const response = await fetch(`${api_url}/chart/pie?${query}`, {
        method: "GET",
        headers: getAuthHeader()  
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to get pie chart data");
      return data;
    } catch (err) {
      console.error(err);
      return [];  
    }
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
      datasets: [{ data, backgroundColor: "#36a2eb" }],
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
        backgroundColor: ["#ff6384", "#36a2eb", "#ffce56", "#4bc0c0", "#9966ff"]
      }],
    });
  };

  return (
    <div className="px-12 py-6">
      <h2 className="text-3xl font-bold mb-6 text-center">Job Statistics</h2>
      <div className="flex justify-center gap-4 mb-6">
        <select
          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={picker}
          onChange={(e) => updateParams("picker", e.target.value)}
        >
          <option value="year">Year</option>
          <option value="month">Month</option>
          <option value="date">Date</option>
        </select>

        {picker === "year" && (
          <input
            type="number"
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter}
            onChange={(e) => updateParams("filter", e.target.value)}
          />
        )}
        {picker === "month" && (
          <input
            type="month"
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter}
            onChange={(e) => updateParams("filter", e.target.value)}
          />
        )}
        {picker === "date" && (
          <input
            type="date"
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter}
            onChange={(e) => updateParams("filter", e.target.value)}
          />
        )}
      </div>

      <div className="flex justify-around gap-12 mt-12">
        <div className="w-[750px] h-[450px]">
          <h3 className="text-xl font-semibold mb-6 text-center">
            {`Jobs Applied in ${filter}`} (Total: {totalJobs})
          </h3>
          {barChartData && (
            <Bar
              data={barChartData}
              options={{
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    enabled: true,
                    callbacks: {
                      label: (context) => `${context.raw} jobs`,
                    },
                  },
                },
              }}
            />
          )}
        </div>

        <div className="flex flex-col items-center w-[400px] h-[350px]">
          <h3 className="text-xl font-semibold mb-6">
            Applications of {filter} (Total: {totalPieJobs})
          </h3>
          {pieChartData && (
            <Pie
              data={pieChartData}
              options={{
                plugins: {
                  legend: { display: false },
                  tooltip: { enabled: true }
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;
