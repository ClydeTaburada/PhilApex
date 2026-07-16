export function AccreditationOverrideModal({
  isOpen,
  message,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
          <span>⚠️</span> Expiration Warning
        </h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn btn-ghost">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="btn btn-crimson">
            Proceed Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
