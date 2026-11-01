import Link from "next/link";

type Props = {
  href?: string | null;
  /** mark = shield only; lockup = shield + V77 Trust wordmark */
  variant?: "mark" | "lockup";
  className?: string;
};

export function LogoMark({ href = "/", variant = "lockup", className = "" }: Props) {
  const img =
    variant === "mark" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/brand/v77-shield-mark.svg" alt="V77" className="h-10 w-auto" width={40} height={48} />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/brand/v77-lockup.svg" alt="V77 Trust" className="h-10 w-auto sm:h-12" width={180} height={56} />
    );

  if (href === null) return <span className={`inline-flex items-center ${className}`}>{img}</span>;
  return (
    <Link href={href || "/"} className={`inline-flex items-center ${className}`} aria-label="V77 Trust home">
      {img}
    </Link>
  );
}
