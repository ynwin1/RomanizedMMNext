"use client";
import React from "react";
import {usePathname, useSearchParams} from "next/navigation";
import {generatePagination} from "@/app/lib/utils";
import {ArrowLeftIcon, ArrowRightIcon} from "@heroicons/react/16/solid";
import Link from "next/link";

const base = "flex h-11 min-w-11 items-center justify-center border text-sm transition-colors";
const Pagination = ({totalPages}: {totalPages: number}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (totalPages <= 1) return null;
  const requested = Number(searchParams.get("page")) || 1;
  const currentPage = Math.min(Math.max(1, requested), totalPages);
  const allPages = generatePagination(currentPage, totalPages);
  const pageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="flex max-w-full flex-wrap items-center justify-center gap-1" aria-label="Pagination">
      <PaginationArrow direction="left" href={pageUrl(currentPage - 1)} disabled={currentPage <= 1} />
      {allPages.map((page, index) => typeof page === "number" ? (
        <Link key={`${index}-${page}`} href={pageUrl(page)}
          aria-label={`Page ${page}`} aria-current={page === currentPage ? "page" : undefined}
          className={`${base} px-3 ${
            page === currentPage
              ? "border-[#DAA276] bg-[#DAA276] font-semibold text-[#171613]"
              : "border-[#514335] bg-[#24211E] text-[#F3EDE3] hover:border-[#DAA276] hover:text-[#DAA276]"
          }`}>
          {page}
        </Link>
      ) : (
        <span key={`${index}-ellipsis`} aria-hidden="true" className="flex h-11 min-w-7 items-center justify-center text-[#CBBEAE]">…</span>
      ))}
      <PaginationArrow direction="right" href={pageUrl(currentPage + 1)} disabled={currentPage >= totalPages} />
    </div>
  );
};

function PaginationArrow({href, direction, disabled}: {href: string; direction: "left" | "right"; disabled: boolean}) {
  const label = direction === "left" ? "Previous page" : "Next page";
  const icon = direction === "left" ? <ArrowLeftIcon className="h-4 w-4" /> : <ArrowRightIcon className="h-4 w-4" />;
  const style = `${base} border-[#514335] bg-[#24211E] px-3 text-[#F3EDE3] hover:border-[#DAA276] hover:text-[#DAA276]`;
  return disabled
    ? <span aria-label={label} aria-disabled="true" className={`${base} cursor-not-allowed border-[#38332E] bg-[#211E1B] px-3 text-[#766F67]`}>{icon}</span>
    : <Link href={href} aria-label={label} className={style}>{icon}</Link>;
}
export default Pagination;
