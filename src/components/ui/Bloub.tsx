export type BloubExpression =
  | "attentive"
  | "idle"
  | "thinking"
  | "happy"
  | "curious"
  | "warning"
  | "success";

type BloubProps = {
  expression?: BloubExpression;
  size?: number;
  label?: string;
};

/**
 * Bloub — the household companion blob. Geometric mascot, MIT-licensed
 * design referenced from the mesa prototype (bloub.vercel.app).
 */
export function Bloub({ expression = "attentive", size = 42, label }: BloubProps) {
  return (
    <svg
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className="bloub state-bot"
      data-expression={expression}
      role={label ? "img" : undefined}
      style={{ width: size, height: size }}
      viewBox="0 0 64 64"
    >
      <path
        className="blob-body"
        d="M32 4C48 4 59 15 59 31c0 17-10 29-27 29S5 48 5 31C5 15 16 4 32 4Z"
      />
      <ellipse className="blob-eye left-eye" cx="23" cy="29" rx="3.2" ry="5" />
      <ellipse className="blob-eye right-eye" cx="41" cy="29" rx="3.2" ry="5" />
      <path className="blob-mouth" d="M25 41q7 5 14 0" />
    </svg>
  );
}
