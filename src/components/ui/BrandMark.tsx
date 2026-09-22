export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="brand-mark"
      style={size === 32 ? undefined : { width: size, height: size }}
      viewBox="0 0 40 40"
    >
      <path
        className="brand-shell"
        d="M7 31V18C7 10.8 12.3 6 19.3 6h1.4C27.7 6 33 10.8 33 18v13a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4Z"
      />
      <path
        className="brand-home"
        d="m12.2 20.7 7.8-7 7.8 7v8.1h-5v-5.5h-5.6v5.5h-5Z"
      />
      <path className="brand-table" d="M14 30.3h12" />
    </svg>
  );
}

export function BrandWordmark() {
  return (
    <span className="brand-wordmark">
      <span>Uri</span>bap
    </span>
  );
}
