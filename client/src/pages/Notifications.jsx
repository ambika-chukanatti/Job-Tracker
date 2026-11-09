import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../components/ToastContext"; // adjust path if needed

const api_url = "https://job-tracker-ya9s.onrender.com/api";

const NETWORK_ERROR = "Can't reach the server. Check your connection and try again.";

const getAuthHeader = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${sessionStorage.getItem("token")}`
});

const formatDate = (dateStr) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const TYPE_LABELS = { follow_up: "Follow-up", deadline: "Deadline" };

const Notifications = () => {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const loadNotifications = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setFailed(false);
    try {
      const response = await fetch(`${api_url}/notification`, { headers: getAuthHeader() });
      const data = await response.json();
      if (!response.ok) {
        setFailed(true);
        toast.error(data.error || "Failed to load notifications.");
        return;
      }
      setNotifications(data.notifications);
    } catch (err) {
      setFailed(true);
      toast.error(NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Refresh every minute so reminders appear on time and disappear once the time has passed
    const timer = setInterval(() => loadNotifications(false), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-8 py-8 transition-colors duration-200">
      <div className="max-w-3xl mx-auto">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-base font-medium text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {notifications.length > 0
              ? `${notifications.length} upcoming reminder${notifications.length === 1 ? "" : "s"}`
              : "Follow-ups and deadlines coming up"}
          </p>
        </div>

        {loading && (
          <div className="text-center py-24 text-sm text-gray-400 dark:text-gray-500">
            Loading notifications… the server may take a few seconds to wake up.
          </div>
        )}

        {!loading && failed && (
          <div className="text-center py-24">
            <button
              onClick={() => loadNotifications()}
              className="text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !failed && notifications.length === 0 && (
          <div className="text-center py-24 text-sm text-gray-400 dark:text-gray-500">
            You're all caught up. A follow-up or deadline shows up here starting a day before it's due.
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={`${n.job_id}-${n.type}`}
              className="bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-500/50 rounded-xl px-5 py-4 transition-colors duration-200"
            >
              <div className="flex items-start gap-3">

                {/* Icon */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/25 dark:text-indigo-300">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/25 dark:text-indigo-300">
                      {TYPE_LABELS[n.type] || "Reminder"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Due {formatDate(n.date)}{n.time ? `, ${n.time}` : ""}
                    </span>
                  </div>

                  <p className="text-sm text-gray-800 dark:text-gray-100">{n.message}</p>

                  <div className="mt-3">
                    <Link
                      to={`/job/${n.job_id}`}
                      className="inline-block text-xs text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      View job
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Notifications;