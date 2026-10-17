import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

const baseField =
  "w-full rounded-lg border-0 bg-card px-3 py-2 text-sm text-fg shadow-sm ring-1 ring-inset ring-border placeholder:text-fg-muted focus:ring-2 focus:ring-inset focus:ring-accent disabled:bg-surface-muted";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return <input ref={ref} className={`${baseField} ${className}`} {...props} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...props }, ref) {
  return <textarea ref={ref} className={`${baseField} ${className}`} {...props} />;
});

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-fg">{label}</span>
      {children}
      {hint && !error ? (
        <span className="block text-xs text-fg-muted">{hint}</span>
      ) : null}
      {error ? (
        <span className="block text-xs font-medium text-red-600">{error}</span>
      ) : null}
    </label>
  );
}
