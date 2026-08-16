import Image from "next/image";

export function Mark({
  className = "h-12 w-12",
  eager = false,
}: {
  className?: string;
  eager?: boolean;
}) {
  return (
    <Image
      src="/allroadslogo.png"
      alt=""
      width={1080}
      height={1130}
      className={`object-contain ${className}`}
      aria-hidden="true"
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
    />
  );
}
