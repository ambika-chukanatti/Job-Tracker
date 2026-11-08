import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

const typeStyles = {
  error:
    "text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950 dark:border-red-900",
  success:
    "text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-950 dark:border-green-900",
  info:
    "text-gray-700 bg-white border-gray-200 dark:text-gray-200 dark:bg-gray-900 dark:border-gray-700",
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // duration = 0 means the toast stays until dismissed
  const show = useCallback(
    (type, text, duration = 4000) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, type, text }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      show,
      dismiss,
      error: (text, duration) => show("error", text, duration),
      success: (text, duration) => show("success", text, duration),
      info: (text, duration) => show("info", text, duration),
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            style={{ animation: "toast-in 0.25s ease-out" }}
            className={
              "pointer-events-auto flex items-start justify-between gap-3 text-sm rounded-lg px-3.5 py-2.5 border shadow-lg " +
              typeStyles[t.type]
            }
          >
            <span>{t.text}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="opacity-60 hover:opacity-100 cursor-pointer leading-none text-base"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
};