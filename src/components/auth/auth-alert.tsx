type AuthAlertProps = {
  error?: string;
  message?: string;
};

export function AuthAlert({ error, message }: AuthAlertProps) {
  const text = error ?? message;

  if (!text) {
    return null;
  }

  return (
    <div
      role={error ? "alert" : "status"}
      className={`mb-6 rounded-xl border px-4 py-3 text-sm leading-6 ${
        error
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-900"
      }`}
    >
      {text}
    </div>
  );
}
