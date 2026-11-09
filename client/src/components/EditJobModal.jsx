import { useState, useEffect } from "react";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const newJob = {
  job_title: "",
  job_url: "",
  company_name: "",
  location: "",
  salary: 0,
  job_description: "",
  status: "",
  notes: "",
  resume: "",
  deadline: null,
  deadline_time: null,
  date_applied: null,
  follow_up: null,
  follow_up_time: null,
  company_id: 0,
};

// Empty values are sent as null so the database stores NULL instead of ""
const nullableFields = ["deadline", "deadline_time", "date_applied", "follow_up", "follow_up_time"];

// MySQL returns TIME as "HH:MM:SS"; <input type="time"> wants "HH:MM"
const toTimeInput = (v) => (v ? String(v).slice(0, 5) : "");

const inputClass =
  "w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-colors duration-200 " +
  "bg-white text-gray-800 border-gray-200 placeholder-gray-300 focus:ring-gray-300 " +
  "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-500 dark:focus:ring-gray-500 dark:[color-scheme:dark] " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const labelClass = "block text-xs text-gray-400 dark:text-gray-500 mb-1.5";

const EditJobModal = ({ ji, job, isOpen, onClose, onSave, companies, isEdit }) => {
  const [formData, setFormData] = useState(isEdit && job ? job : newJob);
  const [fileError, setFileError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(isEdit && job ? job : newJob);
    setFileError("");
  }, [isEdit, job, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = {
      ...formData,
      [name]: nullableFields.includes(name) && value === "" ? null : value,
    };

    // A time means nothing without a date, so clearing a date clears its time
    if (name === "deadline" && value === "") next.deadline_time = null;
    if (name === "follow_up" && value === "") next.follow_up_time = null;

    setFormData(next);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError("Upload a PDF or Word document.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_SIZE) {
      setFileError("The file is too large. The limit is 5 MB.");
      e.target.value = "";
      return;
    }

    setFileError("");
    setFormData({ ...formData, resume: file });
  };

  const handleSubmit = async () => {
    if (saving) return; // prevents double submits
    setSaving(true);
    try {
      // The Dashboard closes the modal after a successful save,
      // so on failure the modal stays open and the user keeps their input.
      await onSave(formData, formData.id, ji);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/25 dark:bg-black/60 flex justify-center items-center z-50 px-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm w-[680px] max-w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {isEdit ? "Edit job" : "Add new job"}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {isEdit ? "Update the details below" : "Fill in the details below"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-300 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Job title</label>
              <input
                type="text"
                name="job_title"
                value={formData.job_title || ""}
                onChange={handleChange}
                placeholder="e.g. Frontend Engineer"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Job URL</label>
              <input
                type="text"
                name="job_url"
                value={formData.job_url || ""}
                onChange={handleChange}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Company</label>
              <select
                name="company_name"
                value={formData.company_name || ""}
                onChange={(e) => {
                  const selectedOption = e.target.options[e.target.selectedIndex];
                  setFormData({
                    ...formData,
                    company_name: e.target.value,
                    company_id: selectedOption.getAttribute("data-id"),
                  });
                }}
                className={inputClass}
              >
                <option value="">Select company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.company_name} data-id={company.id}>
                    {company.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location || ""}
                onChange={handleChange}
                placeholder="e.g. Remote, New York"
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Salary</label>
              <input
                type="text"
                name="salary"
                value={formData.salary || ""}
                onChange={handleChange}
                placeholder="e.g. 120000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                name="status"
                value={formData.status || ""}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select status</option>
                <option value="Bookmarked">Bookmarked</option>
                <option value="Applied">Applied</option>
                <option value="Interviewing">Interviewing</option>
                <option value="Negotiating">Negotiating</option>
                <option value="Accepted">Accepted</option>
                <option value="I Withdrew">I Withdrew</option>
                <option value="Not Selected">Not Selected</option>
                <option value="No Response">No Response</option>
              </select>
            </div>
          </div>

          {/* Row 4: dates */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Date applied</label>
              <input
                type="date"
                name="date_applied"
                value={formData.date_applied || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Deadline</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Follow-up</label>
              <input
                type="date"
                name="follow_up"
                value={formData.follow_up || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 5: times, aligned under their dates (optional; reminders use 23:59 / 09:00 if empty) */}
          <div className="grid grid-cols-3 gap-4">
            <div />
            <div>
              <label className={labelClass}>Deadline time</label>
              <input
                type="time"
                name="deadline_time"
                value={toTimeInput(formData.deadline_time)}
                onChange={handleChange}
                disabled={!formData.deadline}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Follow-up time</label>
              <input
                type="time"
                name="follow_up_time"
                value={toTimeInput(formData.follow_up_time)}
                onChange={handleChange}
                disabled={!formData.follow_up}
                className={inputClass}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Job description</label>
            <textarea
              name="job_description"
              value={formData.job_description || ""}
              onChange={handleChange}
              placeholder="Paste the job description here..."
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={handleChange}
              placeholder="Any personal notes..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Resume */}
          <div>
            <label className={labelClass}>Resume (PDF or Word, up to 5 MB)</label>

            {formData.resume instanceof File ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Selected: {formData.resume.name}</p>
            ) : (
              typeof formData.resume === "string" &&
              formData.resume && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Current file: {formData.resume}</p>
              )
            )}

            <input
              type="file"
              name="resume"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full text-xs text-gray-500 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-200 dark:file:border-gray-700 file:text-xs file:text-gray-600 dark:file:text-gray-300 file:bg-white dark:file:bg-gray-800 hover:file:bg-gray-50 dark:hover:file:bg-gray-700 file:cursor-pointer file:transition-colors"
            />
            {fileError && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1.5">{fileError}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            disabled={saving}
            className="text-sm text-gray-500 dark:text-gray-300 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-500/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="text-sm font-medium bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add job"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditJobModal;