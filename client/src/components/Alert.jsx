const Alert = ({ type = "error", children, onClose }) => {
  if (!children) return null;
  const styles =
    type === "error"
      ? "text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950 dark:border-red-900"
      : "text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-950 dark:border-green-900";

  return (
    <div role="alert" className={`flex justify-between items-start gap-2 text-xs rounded-lg px-3 py-2 border ${styles}`}>
      <span>{children}</span>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100 cursor-pointer">✕</button>
      )}
    </div>
  );
};

export default Alert;