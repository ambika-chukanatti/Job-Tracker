import { useNavigate } from "react-router-dom";

const statusColors = {
  Bookmarked:     "bg-gray-100 text-gray-600",
  Applied:        "bg-blue-50 text-blue-600",
  "No Response":  "bg-yellow-50 text-yellow-600",
  "Not Selected": "bg-red-50 text-red-500",
  "I Withdrew":   "bg-orange-50 text-orange-500",
  Interviewing:   "bg-purple-50 text-purple-600",
  Negotiating:    "bg-teal-50 text-teal-600",
  Accepted:       "bg-green-50 text-green-600",
};

const JobRow = ({ i, job, onEdit, onDelete }) => {
  const navigate = useNavigate();

  return (
    <tr
      className="hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => navigate(`/job/${job?.id}`)}
    >
      <td className="px-4 py-3 text-xs text-gray-400">{i}</td>
      <td className="px-4 py-3 text-sm font-medium text-gray-800">{job.job_title}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{job.company_name}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{job.salary || "—"}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{job.location || "—"}</td>
      <td className="px-4 py-3">
        <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[job.status] || "bg-gray-100 text-gray-500"}`}>
          {job.status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{job.deadline || "—"}</td>
      <td className="px-4 py-3 text-sm text-gray-500">{job.date_applied || "—"}</td>
      <td className="px-4 py-3 text-sm text-gray-500">{job.follow_up || "—"}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onEdit}
            className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 border border-red-100 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
};

export default JobRow;