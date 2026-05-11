import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const api_url = "https://job-tracker-ya9s.onrender.com/api";

const getAuthHeader = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${sessionStorage.getItem("token")}`
});

const JobDetails = ({ location }) => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("info");
  const [job, setJob] = useState(null);
  const statusSteps = ["Bookmarked", "Applying", "Applied", "Interviewing", "Negotiating", "Accepted", "Closed"];

  const getJob = async () => {
    try {
      const response = await fetch(`${api_url}/job/${id}`, {
        method: "GET",
        headers: getAuthHeader()  
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to get the data");
      }

      setJob(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getJob();
  }, []);

  const activeStepIndex = statusSteps.indexOf(job?.status);

  return (
    <div className="w-full min-h-screen px-16 pb-8 pt-4 bg-gray-900 text-white">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold">{job?.job_title}</h1>
      </div>

      <div className="flex justify-center items-center space-x-4 mb-12">
        {statusSteps.map((step, index) => (
          <div
            key={step}
            className={`px-6 py-3 rounded-full text-lg font-semibold ${index <= activeStepIndex ? "bg-blue-500" : "bg-gray-700"}`}
          >
            {step}
          </div>
        ))}
      </div>

      <div className="flex justify-center items-center space-x-6 mb-12">
        {["Bookmarked", "Applied", "Deadline", "Follow-Up"].map((label, index) => (
          <div key={index} className="text-center">
            <p className="text-sm font-semibold text-gray-300">{label}</p>
            <p className="text-lg text-gray-400">{job && job[label.toLowerCase().replace("-", "_")] || "-"}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center space-x-8 mb-6 border-b border-gray-700 pb-2 text-lg font-semibold">
        {[
          { name: "Job Info", key: "info" },
          { name: "Job Description", key: "description" },
          { name: "Notes", key: "notes" },
          { name: "Resume", key: "resume" }
        ].map((tab) => (
          <button
            key={tab.key}
            className={`px-6 py-3 rounded-md transition duration-300 border border-gray-600 ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "text-gray-400 hover:text-blue-600 hover:border-blue-600"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="w-full flex flex-col items-center text-center">
        {activeTab === "info" && (
          <table className="w-3/5 border-collapse border border-gray-700">
            <thead>
              <tr className="bg-gray-800 text-gray-300">
                <th className="py-3 px-4 border border-gray-700">Company Name</th>
                <th className="py-3 px-4 border border-gray-700">Location</th>
                <th className="py-3 px-4 border border-gray-700">Salary</th>
                <th className="py-3 px-4 border border-gray-700">Job URL</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700 text-gray-300">
                <td className="py-3 px-4 border border-gray-700">{job?.company_name || "-"}</td>
                <td className="py-3 px-4 border border-gray-700">{job?.location || "-"}</td>
                <td className="py-3 px-4 border border-gray-700">${job?.salary || "-"}</td>
                <td className="py-3 px-4 border border-gray-700">
                  {job?.job_url ? (
                    <a href={job?.job_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                      Link
                    </a>
                  ) : "-"}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {activeTab === "description" && (
          <div className="w-3/4 text-gray-300 mt-4">{job?.job_description || "No description available."}</div>
        )}

        {activeTab === "notes" && (
          <div className="w-3/4 text-gray-300 mt-4">{job?.notes || "No notes available."}</div>
        )}

        {activeTab === "resume" && (
          <div className="w-3/4 mt-4">
            {job?.resume ? (
              <a href={job?.resume} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline text-lg">
                View Resume
              </a>
            ) : (
              "No resume uploaded."
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetails;
