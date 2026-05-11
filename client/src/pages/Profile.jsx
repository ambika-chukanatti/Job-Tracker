import { useState, useEffect } from "react";
import { GoalEditModal } from "../components";

const api_url = "https://job-tracker-ya9s.onrender.com/api";

const getAuthHeader = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${sessionStorage.getItem("token")}`
});

const Profile = ({ location }) => {
  const [goal, setGoal] = useState(null);
  const [user, setUser] = useState(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  const getGoal = async () => {
    try {
      const response = await fetch(`${api_url}/target`, {
        method: "GET",
        headers: getAuthHeader()  
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch goal");
      setGoal(data);
    } catch (err) {
      console.error(err);
    }
  };

  const getUser = async () => {
    try {
      const response = await fetch(`${api_url}/user`, {
        method: "GET",
        headers: getAuthHeader()  
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch user");
      setUser(data);
    } catch (err) {
      console.error(err);
    }
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;  // ✅ safety confirmation
    try {
      const response = await fetch(`${api_url}/user`, {
        method: "DELETE",
        headers: getAuthHeader() 
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete user");

      sessionStorage.removeItem("token");  
      setUser(null);
      window.location.href = "/";  
    } catch (err) {
      console.error(err);
    }
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

      alert("User details updated");
      setUser(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full flex justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 w-11/12 flex gap-24">
        <div
          onClick={() => setIsGoalModalOpen(true)}
          className="w-7/12 cursor-pointer border border-gray-300 text-white p-6 rounded-xl shadow-lg transform transition-all duration-200"
        >
          <h2 className="text-3xl font-bold mb-4 tracking-wide text-center">Next Career Goal</h2>

          <div className="bg-white text-gray-900 p-6 rounded-lg">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="py-3 px-4 text-lg font-bold">Target Title</th>
                  <th className="py-3 px-4 text-lg font-bold">Target Date</th>
                  <th className="py-3 px-4 text-lg font-bold">Target Salary Range</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-300">
                  <td className="py-3 text-center px-4 text-lg">{goal?.goal || "Not set"}</td>
                  <td className="py-3 text-center px-4 text-lg">{goal?.deadline || "Not set"}</td>
                  <td className="py-3 text-center px-4 text-lg">
                    ${goal?.salary_min || "0"} - ${goal?.salary_max || "0"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-5/12">
          <h2 className="text-2xl font-semibold mb-6 text-center">Profile Information</h2>

          <div className="w-full space-y-4">
            <div>
              <label className="block font-medium text-gray-400">Username</label>
              <input
                type="text"
                name="username"
                value={user?.username || ""}  
                onChange={handleUserChange}
                className="w-full border border-gray-300 p-2 rounded"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-400">Email</label>
              <input
                type="email"
                name="email"
                value={user?.email || ""}  
                onChange={handleUserChange}
                className="w-full border border-gray-300 p-2 rounded"
                placeholder="Enter email"
              />
            </div>

            <div className="flex justify-end mt-4">
              <button
                className="cursor-pointer mr-4 bg-red-400 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={handleDeleteUser}
              >
                Delete User
              </button>
              <button
                className="cursor-pointer bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={handleSaveUser}
              >
                Save
              </button>
            </div>
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
