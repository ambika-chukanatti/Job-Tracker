import { useState, useEffect } from "react";
import { GoalEditModal } from "../components";

const api_url = "https://job-tracker-ya9s.onrender.com/api";

const getAuthHeader = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${sessionStorage.getItem("token")}`
});

const Profile = () => {
  const [goal, setGoal] = useState(null);
  const [user, setUser] = useState(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  const getGoal = async () => {
    try {
      const response = await fetch(`${api_url}/target`, { method: "GET", headers: getAuthHeader() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch goal");
      setGoal(data);
    } catch (err) { console.error(err); }
  };

  const getUser = async () => {
    try {
      const response = await fetch(`${api_url}/user`, { method: "GET", headers: getAuthHeader() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch user");
      setUser(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    getGoal();
    getUser();
  }, []);

  const handleUserChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSaveGoal = async (formData) => {
    try {
      const response = await fetch(`${api_url}/target`, {
        method: "PUT",
        headers: getAuthHeader(),
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update goal");
      setGoal(data.target);
      setIsGoalModalOpen(false);
    } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    try {
      const response = await fetch(`${api_url}/user`, { method: "DELETE", headers: getAuthHeader() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete user");
      sessionStorage.removeItem("token");
      setUser(null);
      window.location.href = "/";
    } catch (err) { console.error(err); }
  };

  const handleSaveUser = async () => {
    try {
      const response = await fetch(`${api_url}/user`, {
        method: "PUT",
        headers: getAuthHeader(),
        body: JSON.stringify(user)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update user");
      setUser(data);
    } catch (err) { console.error(err); }
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-8">

      <div className="mb-6">
        <h1 className="text-base font-medium text-gray-900">Profile</h1>
        <p className="text-xs text-gray-400 mt-0.5">Manage your account and career goal</p>
      </div>

      <div className="grid grid-cols-5 gap-5">

        {/* Profile card — 2/5 */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl px-6 py-5">

          {/* Avatar + name */}
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-500">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{user?.username || "—"}</p>
              <p className="text-xs text-gray-400">{user?.email || "—"}</p>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Username</label>
              <input
                type="text"
                name="username"
                value={user?.username || ""}
                onChange={handleUserChange}
                placeholder="Enter username"
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={user?.email || ""}
                onChange={handleUserChange}
                placeholder="Enter email"
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-300"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100">
            <button
              onClick={handleDeleteUser}
              className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 border border-red-100 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              Delete account
            </button>
            <button
              onClick={handleSaveUser}
              className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>

        {/* Goal card — 3/5 */}
        <div
          onClick={() => setIsGoalModalOpen(true)}
          className="col-span-3 bg-white border border-gray-200 rounded-xl px-6 py-5 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-medium text-gray-800">Career goal</p>
              <p className="text-xs text-gray-400 mt-0.5">Click to edit</p>
            </div>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Target title",        value: goal?.goal                                           },
              { label: "Target date",         value: goal?.deadline                                       },
              { label: "Salary range",        value: goal?.salary_min && goal?.salary_max
                  ? `$${goal.salary_min} – $${goal.salary_max}`
                  : null
              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-medium text-gray-700">{value || "Not set"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <GoalEditModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        goal={goal}
        onSave={handleSaveGoal}
      />
    </div>
  );
};

export default Profile;