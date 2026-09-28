export function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span aria-label={`${rating} из 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? "text-rose-500" : "text-rose-200"}>
          ★
        </span>
      ))}
    </span>
  );
}
