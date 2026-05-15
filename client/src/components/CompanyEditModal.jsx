import { useState, useEffect } from "react";

const fields = [
  { key: "company_name",  label: "Company name",  type: "text"   },
  { key: "industry",      label: "Industry",       type: "text"   },
  { key: "company_size",  label: "Company size",   type: "number" },
  { key: "company_type",  label: "Company type",   type: "text"   },
  { key: "location",      label: "Location",       type: "text"   },
  { key: "website",       label: "Website",        type: "text"   },
  { key: "year_founded",  label: "Year founded",   type: "number" },
];

const newCompany = {
  id: 0,
  company_name: "",
  industry: "",
  company_size: "",
  company_type: "",
  location: "",
  website: "",
  year_founded: 0,
};

const inputClass = "w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-300 bg-white";
const labelClass = "block text-xs text-gray-400 mb-1.5";

const CompanyEditModal = ({ ci, company, isOpen, onClose, onSave, isEdit }) => {
  const [formData, setFormData] = useState(isEdit && company ? company : newCompany);

  useEffect(() => {
    setFormData(isEdit && company ? company : newCompany);
  }, [isEdit, company]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, formData.id, ci);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/25 flex justify-center items-center z-50">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm w-[480px]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-medium text-gray-900">
              {isEdit ? "Edit company" : "Add company"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? "Update the details below" : "Fill in the details below"}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 grid grid-cols-2 gap-4">
            {fields.map(({ key, label, type }) => (
              <div key={key} className={key === "company_name" ? "col-span-2" : ""}>
                <label className={labelClass}>{label}</label>
                <input
                  type={type}
                  name={key}
                  value={formData[key] || ""}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
              {isEdit ? "Save changes" : "Add company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyEditModal;