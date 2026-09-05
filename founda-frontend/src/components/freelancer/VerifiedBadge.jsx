export default function VerifiedBadge({ size = "sm" }) {
  const sizeClasses = size === "lg"
    ? "px-3 py-1.5 text-xs"
    : "px-2.5 py-1 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-founda-purple to-founda-teal font-semibold text-white ${sizeClasses}`}
    >
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3 w-3"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 1.5l2.163 1.03 2.396-.294 1.06 2.157 2.157 1.06-.294 2.396L18.5 10l-1.03 2.163.294 2.396-2.157 1.06-1.06 2.157-2.396-.294L10 18.5l-2.163-1.03-2.396.294-1.06-2.157-2.157-1.06.294-2.396L1.5 10l1.03-2.163-.294-2.396 2.157-1.06 1.06-2.157 2.396.294L10 1.5zm3.03 6.22a.75.75 0 00-1.06-1.06L9 9.63 7.28 7.91a.75.75 0 10-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l3.5-3.5z"
          clipRule="evenodd"
        />
      </svg>
      Verified
    </span>
  );
}
