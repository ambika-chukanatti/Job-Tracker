import { Link, useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-3 flex justify-between items-center">
      <Link to="/dashboard" className="text-lg font-bold text-gray-900 tracking-wide">
        Job Tracker
      </Link>

      <nav className="flex items-center gap-1">
        <Link
          to="/statistics"
          className="text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
        >
          Statistics
        </Link>
        <Link
          to="/companies"
          className="text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
        >
          Companies
        </Link>
        <Link
          to="/profile"
          className="text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
        >
          Profile
        </Link>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <button
          onClick={handleLogout}
          className="text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors cursor-pointer"
        >
          Logout
        </button>
      </nav>
    </header>
  );
};

export default Header;