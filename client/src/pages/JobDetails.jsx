import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastContext"; // adjust path if needed

const api_url = "https://job-tracker-ya9s.onrender.com/api";

const NETWORK_ERROR = "Can't reach the server. Check your connection and try again.";

const getAuthHeader = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${sessionStorage.getItem("token")}`
});

// The backend stores just a filename, so build the full link. Full URLs (e.g. Cloudinary) are used as is.
const getResumeUrl = (resume) =>
  /^https?:\/\//.test(resume) ? resume : `${api_url.replace(/\/api$/, "")}/uploads/${resume}`;

const statusSteps = ["Bookmarked", "Applying", "Applied", "Interviewing", "Negotiating", "Accepted", "Closed"];

// Light mode keeps the soft pastel look. Dark mode uses a translucent tint of the
// same color with a lighter text, so every status stays vivid on a dark background.
const statusColors = {
  Bookmarked:    "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300",
  Applied:       "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
  "No Response": "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-300",
  "Not Selected":"bg-red-50 text-red-500 dark:bg-red-500/20 dark:text-red-300",
  "I Withdrew":  "bg-orange-50 text-orange-500 dark:bg-orange-500/20 dark:text-orange-300",
  Interviewing:  "bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300",
  Negotiating:   "bg-teal-50 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300",
  Accepted:      "bg-green-50 text-green-600 dark:bg-green-500/20 dark:text-green-300",
  Closed:        "bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400",
};

const cardClass =
  "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl transition-colors duration-200";

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("info");
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const getJob = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${api_url}/job/${id}`, {
        method: "GET",
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (!response.ok) {
        setJob(null);
        toast.error(data.error || "Failed to load this job.");
        return;
      }
      setJob(data);
    } catch (err) {
      setJob(null);
      toast.error(NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getJob();
  }, [id]); // reload if the user opens a different job

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-8 py-8 transition-colors duration-200">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 mb-6 transition-colors cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back
      </button>

      {/* Loading */}
      {loading && (
        <div className="text-center py-24 text-sm text-gray-300 dark:text-gray-600">
          Loading job… the server may take a few seconds to wake up.
        </div>
      )}

      {/* Load failed: the error itself shows as a toast, this is just the empty state */}
      {!loading && !job && (
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <p className="text-sm text-gray-400 dark:text-gray-500">This job couldn't be loaded.</p>
          <button
            onClick={getJob}
            className="text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loaded */}
      {!loading && job && (
        <>
          {/* Header */}
          <div className={`${cardClass} px-6 py-5 mb-5`}>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-base font-medium text-gray-900 dark:text-gray-100">{job.job_title || "—"}</h1>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{job.company_name || "—"}</p>
              </div>
              {job.status && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[job.status] || "bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400"}`}>
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
                        className={`h-1 w-full ${isActive ? "bg-gray-800 dark:bg-indigo-400" : "bg-gray-100 dark:bg-gray-800"}
                          ${isFirst ? "rounded-l-full" : ""} ${isLast ? "rounded-r-full" : ""}`}
                      />
                      <span className={`text-xs ${isActive ? "text-gray-700 dark:text-gray-100 font-medium" : "text-gray-300 dark:text-gray-600"}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Meta fields */}
            <div className="grid grid-cols-4 gap-2 mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
              {metaFields.map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 mt-0.5">{value || "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className={`${cardClass} overflow-hidden`}>
            <div className="flex border-b border-gray-100 dark:border-gray-800">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-3 text-xs font-medium transition-colors cursor-pointer
                    ${activeTab === tab.key
                      ? "text-gray-900 dark:text-gray-100 border-b-2 border-gray-900 dark:border-indigo-400 -mb-px"
                      : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
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
                    { label: "Company",  value: job.company_name },
                    { label: "Location", value: job.location     },
                    { label: "Salary",   value: job.salary ? `$${job.salary}` : null },
                    { label: "Job URL",  value: job.job_url, isLink: true },
                  ].map(({ label, value, isLink }) => (
                    <div key={label} className="text-center">
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
                      {isLink && value ? (
                        <a href={value} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-blue-500 dark:text-blue-400 hover:underline">
                          View posting
                        </a>
                      ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-200">{value || "—"}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "description" && (
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {job.job_description || "No description available."}
                </p>
              )}

              {activeTab === "notes" && (
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {job.notes || "No notes available."}
                </p>
              )}

              {activeTab === "resume" && (
                <div className="flex justify-center items-center h-32">
                  {job.resume ? (
                    <a href={getResumeUrl(job.resume)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      View resume
                    </a>
                  ) : (
                    <p className="text-sm text-gray-300 dark:text-gray-600">No resume uploaded.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default JobDetails;