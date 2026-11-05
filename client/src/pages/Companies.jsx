import { useState, useEffect } from "react";
import { CompanyCard, CompanyDetailsModal, CompanyEditModal, Alert } from "../components";

const api_url = "https://job-tracker-ya9s.onrender.com/api";

const NETWORK_ERROR = "Can't reach the server. Check your connection and try again.";

const getAuthHeader = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${sessionStorage.getItem("token")}`
});

const Companies = () => {
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [ci, setCi] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [error, setError] = useState("");

  const getCompanies = async () => {
    try {
      const response = await fetch(`${api_url}/company`, {
        method: "GET",
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to load companies.");
        return;
      }
      setCompanies(data);
    } catch (err) {
      setError(NETWORK_ERROR);
    }
  };

  useEffect(() => {
    getCompanies();
  }, []);

  const handleSave = async (formData, id) => {
    setError("");
    const url = isEdit ? `${api_url}/company/${id}` : `${api_url}/company`;
    try {
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: getAuthHeader(),
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to save company.");
        return;
      }
      if (isEdit) {
        setCompanies((prev) => prev.map((c) => (c.id === data.company.id ? data.company : c)));
      } else {
        setCompanies((prev) => [...prev, data.company]);
      }
      // close whichever modal was used
      setIsDetailsModalOpen(false);
      setIsEditModalOpen(false);
    } catch (err) {
      setError(NETWORK_ERROR);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this company?")) return;
    setError("");
    try {
      const response = await fetch(`${api_url}/company/${id}`, {
        method: "DELETE",
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to delete company.");
        return;
      }
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      setIsDetailsModalOpen(false);
    } catch (err) {
      setError(NETWORK_ERROR);
    }
  };

  const filteredCompanies = companies.filter((company) =>
    (company.company_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-8">

      {/* Error alert */}
      {error && (
        <div className="mb-4">
          <Alert onClose={() => setError("")}>{error}</Alert>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-medium text-gray-900">Companies</h1>
          <p className="text-xs text-gray-400 mt-0.5">{companies.length} {companies.length === 1 ? "company" : "companies"} tracked</p>
        </div>
        <button
          onClick={() => {
            setError("");
            setIsEdit(false);
            setIsEditModalOpen(true);
          }}
          className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add company
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm text-sm pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-300 bg-white"
        />
      </div>

      {/* Grid */}
      {filteredCompanies.length === 0 ? (
        <div className="text-center py-24 text-sm text-gray-300">
          {search ? "No companies match your search." : "No companies yet — add one to get started."}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredCompanies.map((company, i) => (
            <CompanyCard
              key={company.id}
              company={company}
              onOpen={() => {
                setError("");
                setCi(i);
                setIsEdit(true);
                setSelectedCompany(company);
                setIsDetailsModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <CompanyDetailsModal
        ci={ci}
        company={selectedCompany}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <CompanyEditModal
        company={selectedCompany}
        isEdit={false}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Companies;