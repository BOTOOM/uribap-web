type Props = {
  compact?: boolean;
};

export function UribapBrand({ compact = false }: Props) {
  return (
    <span
      className={compact ? "uribap-brand uribap-brand-compact" : "uribap-brand"}
      role="img"
      aria-label="Uribap"
    >
      <svg
        aria-hidden="true"
        className="uribap-brand-mark"
        focusable="false"
        viewBox="0 0 40 40"
      >
        <path
          className="uribap-brand-shell"
          d="M7 31V18C7 10.8 12.3 6 19.3 6h1.4C27.7 6 33 10.8 33 18v13a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4Z"
        />
        <path
          className="uribap-brand-home"
          d="m12.2 20.7 7.8-7 7.8 7v8.1h-5v-5.5h-5.6v5.5h-5Z"
        />
        <path className="uribap-brand-table" d="M14 30.3h12" />
      </svg>
      <span className="uribap-brand-wordmark">
        <span>Uri</span>bap
      </span>
    </span>
  );
}
