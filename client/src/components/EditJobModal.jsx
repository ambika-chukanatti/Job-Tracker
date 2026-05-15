import { useState, useEffect } from "react";

const EditJobModal = ({ ji, job, isOpen, onClose, onSave, companies, isEdit }) => {
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
    date_applied: null,
    follow_up: null,
    company_id: 0,
  };

  const [formData, setFormData] = useState(isEdit && job ? job : newJob);
  const dateFields = ["deadline", "date_applied", "follow_up"];

  useEffect(() => {
    setFormData(isEdit && job ? job : newJob);
  }, [isEdit, job]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: dateFields.includes(name) && value === "" ? null : value,
    });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, resume: e.target.files[0] });
  };

  const handleSubmit = () => {
    onSave(formData, formData.id, ji);
    onClose();
  };

  if (!isOpen) return null;

  const inputClass = "w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-300 bg-white";
  const labelClass = "block text-xs text-gray-400 mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/25 flex justify-center items-center z-50">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm w-[680px] max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-medium text-gray-900">
              {isEdit ? "Edit job" : "Add new job"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? "Update the details below" : "Fill in the details below"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
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

          {/* Row 4 — dates */}
          <div className="grid grid-cols-3 gap-4">
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
            <label className={labelClass}>Resume</label>
            <input
              type="file"
              name="resume"
              onChange={handleFileChange}
              className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-200 file:text-xs file:text-gray-600 file:bg-white hover:file:bg-gray-50 file:cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            {isEdit ? "Save changes" : "Add job"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditJobModal;