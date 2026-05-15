import React, { useEffect, useState } from "react";
import { JobRow, EditJobModal } from "../components";
import { useSearchParams } from "react-router-dom";
import { ArrowUpDown, ArrowDownUp } from "lucide-react";

const api_url = "https://job-tracker-ya9s.onrender.com/api";

const getAuthHeader = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${sessionStorage.getItem("token")}`
});

const statusOptions = ["Bookmarked", "Applied", "No Response", "Not Selected", "I Withdrew", "Interviewing", "Negotiating", "Accepted"];

const statusColors = {
  Bookmarked:    { bg: "bg-gray-100",   text: "text-gray-600"   },
  Applied:       { bg: "bg-blue-50",    text: "text-blue-600"   },
  "No Response": { bg: "bg-yellow-50",  text: "text-yellow-600" },
  "Not Selected":{ bg: "bg-red-50",     text: "text-red-500"    },
  "I Withdrew":  { bg: "bg-orange-50",  text: "text-orange-500" },
  Interviewing:  { bg: "bg-purple-50",  text: "text-purple-600" },
  Negotiating:   { bg: "bg-teal-50",    text: "text-teal-600"   },
  Accepted:      { bg: "bg-green-50",   text: "text-green-600"  },
};

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedJob, setSelectedJob] = useState(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isEditJob, setIsEditJob] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [ji, setJi] = useState(null);

  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "";
  const filter = searchParams.get("filter") || "All";
  const order = searchParams.get("order") || "asc";

  const getJobs = async (filter = "All", search = "", sortBy = "", order = "asc") => {
    const query = new URLSearchParams({ filter, search, sortBy, order }).toString();
    try {
      const response = await fetch(`${api_url}/job?${query}`, {
        method: "GET",
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch jobs");
      setJobs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const getCompanies = async () => {
    try {
      const response = await fetch(`${api_url}/company`, {
        method: "GET",
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch companies");
      setCompanies(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getJobs(filter, search, sortBy, order);
    getCompanies();
  }, []);

  const statusCounts = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {});

  const updateFilters = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);

    getJobs(
      newParams.get("filter") || "All",
      newParams.get("search") || "",
      newParams.get("sortBy") || "",
      newParams.get("order") || "asc"
    );
  };

  const handleEdit = (job, ji) => {
    setJi(ji);
    setSelectedJob(job);
    setIsEditJob(true);
    setEditModalOpen(true);
  };

  const handleAddNewJob = () => {
    setIsEditJob(false);
    setEditModalOpen(true);
  };

  const handleSave = async (formData, id, ji) => {
    const url = isEditJob ? `${api_url}/job/${id}` : `${api_url}/job`;
    const method = isEditJob ? "PUT" : "POST";
    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeader(),
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save job");
      if (isEditJob) {
        const updatedJobs = [...jobs];
        updatedJobs[ji] = data.job;
        setJobs(updatedJobs);
      } else {
        setJobs([...jobs, data.job]);
      }
      setEditModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, ji) => {
    try {
      const response = await fetch(`${api_url}/job/${id}`, {
        method: "DELETE",
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete job");
      const updatedJobs = [...jobs];
      updatedJobs.splice(ji, 1);
      setJobs(updatedJobs);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-8">

      {/* Status Cards */}
      <div className="grid grid-cols-8 gap-3 mb-8">
        {statusOptions.map(status => {
          const { bg, text } = statusColors[status];
          return (
            <div
              key={status}
              onClick={() => updateFilters("filter", filter === status ? "All" : status)}
              className={`${bg} border border-gray-200 rounded-xl p-3 text-center cursor-pointer transition-all hover:shadow-sm ${filter === status ? "ring-1 ring-gray-400" : ""}`}
            >
              <p className={`text-2xl font-medium ${text}`}>{statusCounts[status] || 0}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{status}</p>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 mb-5 flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => updateFilters("search", e.target.value)}
            className="w-full text-sm pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-300"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 whitespace-nowrap">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => updateFilters("sortBy", e.target.value)}
            className="text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white text-gray-700 cursor-pointer"
          >
            <option value="">None</option>
            <option value="deadline">Deadline</option>
            <option value="date_applied">Date Applied</option>
            <option value="follow_up">Follow Up</option>
          </select>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Filter</span>
          <select
            value={filter}
            onChange={(e) => updateFilters("filter", e.target.value)}
            className="text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white text-gray-700 cursor-pointer"
          >
            <option value="All">All</option>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Order toggle */}
        <button
          onClick={() => updateFilters("order", order === "asc" ? "desc" : "asc")}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 cursor-pointer"
          title="Toggle order"
        >
          {order === "asc" ? <ArrowUpDown className="w-4 h-4" /> : <ArrowDownUp className="w-4 h-4" />}
        </button>

        {/* Add job */}
        <button
          onClick={handleAddNewJob}
          className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add job
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["#", "Position", "Company", "Salary", "Location", "Status", "Deadline", "Applied", "Follow Up", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-16 text-sm text-gray-300">
                  No jobs yet — add one to get started.
                </td>
              </tr>
            ) : (
              jobs.map((job, i) => (
                <JobRow
                  key={job.id}
                  i={i + 1}
                  job={job}
                  onEdit={() => handleEdit(job, i)}
                  onDelete={() => handleDelete(job.id, i)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      {jobs.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-right">
          {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
        </p>
      )}

      <EditJobModal
        ji={ji}
        job={selectedJob}
        companies={companies}
        isEdit={isEditJob}
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default Dashboard;