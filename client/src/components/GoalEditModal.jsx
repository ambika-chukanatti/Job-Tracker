import { useState, useEffect } from "react";

const newGoal = {
  goal: "",
  deadline: "",
  salary_min: 0,
  salary_max: 0,
};

const inputClass = "w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-300 bg-white";
const labelClass = "block text-xs text-gray-400 mb-1.5";

const GoalEditModal = ({ goal, onSave, onClose, isOpen }) => {
  const [formData, setFormData] = useState(goal ?? newGoal);

  useEffect(() => {
    setFormData(goal ?? newGoal);
  }, [goal]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/25 flex justify-center items-center z-50">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm w-[440px]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-medium text-gray-900">Career goal</h2>
            <p className="text-xs text-gray-400 mt-0.5">Set your next target</p>
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
          <div>
            <label className={labelClass}>Target title</label>
            <input
              type="text"
              name="goal"
              value={formData.goal || ""}
              onChange={handleChange}
              placeholder="e.g. Senior Frontend Engineer"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Target date</label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline || ""}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Min salary ($)</label>
              <input
                type="number"
                name="salary_min"
                value={formData.salary_min || ""}
                onChange={handleChange}
                placeholder="e.g. 80000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Max salary ($)</label>
              <input
                type="number"
                name="salary_max"
                value={formData.salary_max || ""}
                onChange={handleChange}
                placeholder="e.g. 120000"
                className={inputClass}
              />
            </div>
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
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalEditModal;