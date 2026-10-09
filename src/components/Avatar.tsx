const PALETTE = ["#fb7185", "#f472b6", "#ec4899", "#e879f9", "#fb923c", "#f59e0b"];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function Avatar({
  name,
  email,
  size = 40,
}: {
  name?: string | null;
  email: string;
  size?: number;
}) {
  const label = (name ?? email).trim();
  const initial = label.charAt(0).toUpperCase() || "?";
  const color = PALETTE[hashString(email) % PALETTE.length];

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.42 }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
