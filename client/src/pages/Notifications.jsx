import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../components/ToastContext"; // adjust path if needed

const api_url = "https://job-tracker-ya9s.onrender.com/api";

const NETWORK_ERROR = "Can't reach the server. Check your connection and try again.";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getAuthHeader = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${sessionStorage.getItem("token")}`
});

const typeStyles = {
  deadline: {
    label: "Deadline",
    badge: "bg-amber-50 text-amber-600 dark:bg-amber-500/25 dark:text-amber-300",
    icon: "bg-amber-50 text-amber-600 dark:bg-amber-500/25 dark:text-amber-300",
    path: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  follow_up: {
    label: "Follow-up",
    badge: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/25 dark:text-indigo-300",
    icon: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/25 dark:text-indigo-300",
    path: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
  },
};

const inputClass =
  "w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-colors duration-200 " +
  "bg-white text-gray-800 border-gray-200 placeholder-gray-300 focus:ring-gray-300 " +
  "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:placeholder-gray-500 dark:focus:ring-gray-500 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const formatDate = (dateStr) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const Notifications = () => {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Which follow-up notification has its email form open, and what's in it
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({ to: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const unread = notifications.filter((n) => !n.is_read).length;

  const loadNotifications = async () => {
    try {
      const response = await fetch(`${api_url}/notification`, { headers: getAuthHeader() });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to load notifications.");
        return;
      }
      setNotifications(data.notifications);
    } catch (err) {
      toast.error(NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (id) => {
    // Update the screen right away, the server call happens in the background
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await fetch(`${api_url}/notification/${id}/read`, { method: "PATCH", headers: getAuthHeader() });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      const response = await fetch(`${api_url}/notification/read-all`, {
        method: "PATCH",
        headers: getAuthHeader(),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        toast.error(data?.error || "Failed to update notifications.");
        return;
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      toast.error(NETWORK_ERROR);
    }
  };

  const dismiss = async (id) => {
    try {
      const response = await fetch(`${api_url}/notification/${id}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        toast.error(data?.error || "Failed to dismiss the notification.");
        return;
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (openId === id) setOpenId(null);
    } catch (err) {
      toast.error(NETWORK_ERROR);
    }
  };

  const openEmailForm = (n) => {
    setOpenId(n.id);
    setForm({
      to: "",
      subject: n.defaultEmail?.subject || "",
      message: n.defaultEmail?.message || "",
    });
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const sendEmail = async (e, n) => {
    e.preventDefault();

    if (!EMAIL_REGEX.test(form.to.trim())) {
      toast.error("Enter a valid recruiter email address.");
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`${api_url}/notification/${n.id}/follow-up-email`, {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(data?.error || "Couldn't send the email. Try again.");
        return;
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === n.id
            ? { ...item, is_read: true, email_sent_at: data?.email_sent_at || new Date().toISOString() }
            : item
        )
      );
      setOpenId(null);
      toast.success("Follow-up email sent.");
    } catch (err) {
      toast.error(NETWORK_ERROR);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-8 py-8 transition-colors duration-200">
      <div className="max-w-3xl mx-auto">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-base font-medium text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {unread > 0 ? `${unread} unread` : "Deadlines and follow-ups that need your attention"}
            </p>
          </div>
          <button
            onClick={markAllRead}
            disabled={unread === 0}
            className="text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Mark all as read
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-24 text-sm text-gray-400 dark:text-gray-500">
            Loading notifications… the server may take a few seconds to wake up.
          </div>
        )}

        {/* Empty */}
        {!loading && notifications.length === 0 && (
          <div className="text-center py-24 text-sm text-gray-400 dark:text-gray-500">
            You're all caught up. Deadlines and follow-ups will show up here.
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {notifications.map((n) => {
            const style = typeStyles[n.type];
            const isFollowUp = n.type === "follow_up";
            const formOpen = openId === n.id;

            return (
              <div
                key={n.id}
                className={
                  "bg-white dark:bg-gray-900 border rounded-xl px-5 py-4 transition-colors duration-200 " +
                  (n.is_read
                    ? "border-gray-200 dark:border-gray-700"
                    : "border-indigo-200 dark:border-indigo-500/50")
                }
              >
                <div className="flex items-start gap-3">

                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${style.icon}`}>
                    <svg className="w-4.5 h-4.5" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={style.path} />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.badge}`}>
                        {style.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Due {formatDate(n.due_date)}
                      </span>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400" title="Unread" />
                      )}
                    </div>

                    <p className="text-sm text-gray-800 dark:text-gray-100">{n.message}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      <Link
                        to={`/job/${n.job_id}`}
                        onClick={() => !n.is_read && markRead(n.id)}
                        className="text-xs text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        View job
                      </Link>

                      {isFollowUp && !n.email_sent_at && !formOpen && (
                        <button
                          onClick={() => openEmailForm(n)}
                          className="text-xs font-medium bg-gray-900 dark:bg-indigo-500 text-white rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          Send follow-up email
                        </button>
                      )}

                      {isFollowUp && n.email_sent_at && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-600 dark:bg-green-500/25 dark:text-green-300">
                          Email sent {new Date(n.email_sent_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Email form */}
                    {isFollowUp && formOpen && (
                      <form onSubmit={(e) => sendEmail(e, n)} className="mt-4 space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Recruiter's email</label>
                          <input
                            type="email"
                            name="to"
                            value={form.to}
                            onChange={handleFormChange}
                            placeholder="recruiter@company.com"
                            required
                            disabled={sending}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Subject</label>
                          <input
                            type="text"
                            name="subject"
                            value={form.subject}
                            onChange={handleFormChange}
                            maxLength={200}
                            required
                            disabled={sending}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Message</label>
                          <textarea
                            name="message"
                            value={form.message}
                            onChange={handleFormChange}
                            rows={8}
                            maxLength={5000}
                            required
                            disabled={sending}
                            className={`${inputClass} resize-y`}
                          />
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                            Replies from the recruiter will go to your account email.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            disabled={sending}
                            className="text-xs font-medium bg-gray-900 dark:bg-indigo-500 text-white rounded-lg px-4 py-2 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {sending ? "Sending…" : "Send email"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setOpenId(null)}
                            disabled={sending}
                            className="text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={() => dismiss(n.id)}
                    aria-label="Dismiss notification"
                    title="Dismiss"
                    className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 text-lg leading-none cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Notifications;