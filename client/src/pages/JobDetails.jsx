import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const api_url = "https://job-tracker-ya9s.onrender.com/api";

const getAuthHeader = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${sessionStorage.getItem("token")}`
});

const statusSteps = ["Bookmarked", "Applying", "Applied", "Interviewing", "Negotiating", "Accepted", "Closed"];

const statusColors = {
  Bookmarked:    "bg-gray-100 text-gray-600",
  Applied:       "bg-blue-50 text-blue-600",
  "No Response": "bg-yellow-50 text-yellow-600",
  "Not Selected":"bg-red-50 text-red-500",
  "I Withdrew":  "bg-orange-50 text-orange-500",
  Interviewing:  "bg-purple-50 text-purple-600",
  Negotiating:   "bg-teal-50 text-teal-600",
  Accepted:      "bg-green-50 text-green-600",
  Closed:        "bg-gray-100 text-gray-500",
};

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");
  const [job, setJob] = useState(null);

  const getJob = async () => {
    try {
      const response = await fetch(`${api_url}/job/${id}`, {
        method: "GET",
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to get the data");
      setJob(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getJob();
  }, []);

  const activeStepIndex = statusSteps.indexOf(job?.status);

  const tabs = [
    { name: "Job info",    key: "info"        },
    { name: "Description", key: "description" },
    { name: "Notes",       key: "notes"       },
    { name: "Resume",      key: "resume"      },
  ];

  const metaFields = [
    { label: "Bookmarked", value: job?.bookmarked  },
    { label: "Applied",    value: job?.date_applied },
    { label: "Deadline",   value: job?.deadline    },
    { label: "Follow-up",  value: job?.follow_up   },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-8">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 mb-6 transition-colors cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-base font-medium text-gray-900">{job?.job_title || "—"}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{job?.company_name || "—"}</p>
          </div>
          {job?.status && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[job.status] || "bg-gray-100 text-gray-500"}`}>
              {job.status}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex items-center gap-0">
            {statusSteps.map((step, index) => {
              const isActive = index <= activeStepIndex;
              const isFirst = index === 0;
              const isLast = index === statusSteps.length - 1;
              return (
                <div key={step} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className={`h-1 w-full ${isActive ? "bg-gray-800" : "bg-gray-100"}
                      ${isFirst ? "rounded-l-full" : ""} ${isLast ? "rounded-r-full" : ""}`}
                  />
                  <span className={`text-xs ${isActive ? "text-gray-700 font-medium" : "text-gray-300"}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Meta fields */}
        <div className="grid grid-cols-4 gap-2 mt-5 pt-5 border-t border-gray-100">
          {metaFields.map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm text-gray-700 mt-0.5">{value || "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-xs font-medium transition-colors cursor-pointer
                ${activeTab === tab.key
                  ? "text-gray-900 border-b-2 border-gray-900 -mb-px"
                  : "text-gray-400 hover:text-gray-600"
                }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div className="px-8 py-6 min-h-40">
          {activeTab === "info" && (
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: "Company",  value: job?.company_name },
                { label: "Location", value: job?.location     },
                { label: "Salary",   value: job?.salary ? `$${job.salary}` : null },
                { label: "Job URL",  value: job?.job_url, isLink: true },
              ].map(({ label, value, isLink }) => (
                <div key={label} className="text-center">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  {isLink && value ? (
                    <a href={value} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline">
                      View posting
                    </a>
                  ) : (
                    <p className="text-sm text-gray-700">{value || "—"}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "description" && (
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {job?.job_description || "No description available."}
            </p>
          )}

          {activeTab === "notes" && (
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {job?.notes || "No notes available."}
            </p>
          )}

          {activeTab === "resume" && (
            <div className="flex justify-center items-center h-32">
              {job?.resume ? (
                <a href={job.resume} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-700 border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  View resume
                </a>
              ) : (
                <p className="text-sm text-gray-300">No resume uploaded.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetails;