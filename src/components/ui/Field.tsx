import type { InputHTMLAttributes, ReactNode } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  error?: string;
};

export function Field({ id, label, hint, error, ...inputProps }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="ui-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-describedby={describedBy} aria-invalid={Boolean(error)} {...inputProps} />
      {hint ? <span id={hintId} className="ui-field-hint">{hint}</span> : null}
      {error ? <span id={errorId} className="ui-field-error" role="alert">{error}</span> : null}
    </div>
  );
}
