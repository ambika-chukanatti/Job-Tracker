const CompanyCard = ({ company, onOpen }) => {
  const initials = company.company_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      onClick={() => onOpen(company)}
      className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
    >
      {/* Avatar + Name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 shrink-0">
          {initials}
        </div>
        <h2 className="text-sm font-medium text-gray-800 truncate">{company.company_name}</h2>
      </div>

      {/* Details */}
      <div className="space-y-1.5">
        {[
          { label: "Industry",  value: company.industry },
          { label: "Location",  value: company.location },
          { label: "Type",      value: company.company_type },
          { label: "Founded",   value: company.year_founded },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-baseline gap-2">
            <span className="text-xs text-gray-400 shrink-0">{label}</span>
            <span className="text-xs text-gray-700 truncate text-right">{value || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyCard;