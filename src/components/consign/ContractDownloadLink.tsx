import type { ReactNode } from "react";
import { brand } from "@/lib/brand";

export function ContractDownloadLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={brand.contractPdf}
      download="vehicle-deposit-contract.pdf"
      className={className}
    >
      {children}
    </a>
  );
}
