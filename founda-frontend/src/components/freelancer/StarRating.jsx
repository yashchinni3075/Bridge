export default function StarRating({ rating = 0, size = "md", showValue = false }) {
  const sizeClasses =
    size === "lg"
      ? "h-6 w-6 text-xl"
      : size === "sm"
        ? "h-3.5 w-3.5 text-sm"
        : "h-5 w-5 text-base";

  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(rating);
        return (
          <span
            key={star}
            className={`${sizeClasses} ${
              filled ? "text-amber-400" : "text-founda-line"
            }`}
            aria-hidden="true"
          >
            &#9733;
          </span>
        );
      })}
      {showValue && (
        <span className="ml-1.5 text-xs font-semibold text-founda-muted">
          {rating}/5
        </span>
      )}
    </span>
  );
}
