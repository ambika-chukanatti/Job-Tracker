import { useState } from 'react';
import { CompanyEditModal } from "../components";

const CompanyDetailsModal = ({ ci, company, isOpen, onClose, onDelete, onSave }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!isOpen || !company) return null;

  const initials = company.company_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const fields = [
    { label: "Industry", value: company.industry },
    { label: "Size",     value: company.company_size ? `${company.company_size} employees` : null },
    { label: "Type",     value: company.company_type },
    { label: "Location", value: company.location },
    { label: "Founded",  value: company.year_founded },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/25 flex justify-center items-center z-50">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm w-[480px]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{company.company_name}</p>
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline"
                  >
                    {company.website}
                  </a>
                )}
              </div>
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

          {/* Fields */}
          <div className="px-6 py-4 grid grid-cols-2 gap-x-8 gap-y-4">
            {fields.map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm text-gray-700">{value || "—"}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <button
              onClick={() => onDelete(company.id, ci)}
              className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 border border-red-100 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              Delete
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      <CompanyEditModal
        ci={ci}
        company={company}
        isOpen={isEditModalOpen}
        isEdit={true}
        onClose={() => setIsEditModalOpen(false)}
        onSave={onSave}
      />
    </>
  );
};

export default CompanyDetailsModal;