"use client";
import React from 'react'
import {usePathname, useSearchParams} from "next/navigation";
import {generatePagination} from "@/app/lib/utils";
import clsx from "clsx";
import {ArrowLeftIcon, ArrowRightIcon} from "@heroicons/react/16/solid";
import Link from "next/link";

const Pagination = ({totalPages}: {totalPages: number}) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentPage = Number(searchParams.get('page')) || 1;
    const allPages = generatePagination(currentPage, totalPages);

    const createPageURL = (page: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        return `${pathname}?${params.toString()}`;
    }

    return (
        <>
            <div className="inline-flex">
                <PaginationArrow
                    direction="left"
                    href={createPageURL(currentPage-1)}
                    isDisabled={currentPage <= 1}
                />

                <div className="flex -space-x-px">
                    {allPages.map((page, index) => {
                        let position: 'first' | 'last' | 'single' | 'middle' | undefined;

                        if (index === 0) position = 'first';
                        if (index === allPages.length - 1) position = 'last';
                        if (allPages.length === 1) position = 'single';
                        if (typeof page === 'string' && page === '...') position = 'middle';

                        return (
                            <PaginationNumber
                                key={`${index}-${page}`}
                                href={createPageURL(page)}
                                page={page}
                                position={position}
                                isCurrentPage={currentPage === page}
                            />
                        );
                    })}
                </div>

                <PaginationArrow
                    direction="right"
                    href={createPageURL(currentPage + 1)}
                    isDisabled={currentPage >= totalPages}
                />
            </div>
        </>
    )
}

function PaginationNumber({href, page, position, isCurrentPage}: {href: string, page: number | string, position: 'first' | 'last' | 'single' | 'middle' | undefined, isCurrentPage: boolean}) {
    const className = clsx(
        'flex h-10 w-10 items-center justify-center rounded-md border',
        {
            'rounded-l-md': position === 'first' || position === 'single',
            'rounded-r-md': position === 'last' || position === 'single',
            'z-10 bg-blue-500 border-2 border-gray-100 text-white': isCurrentPage,
            'hover:bg-gray-500': !isCurrentPage && position !== 'middle',
            'text-gray-300': position === 'middle',
        }
    );

    return isCurrentPage || position === 'middle' ? (
        <div className={className}>{page}</div>
    ) : (
        <Link href={href} className={className}>
            {page}
        </Link>
    );
}

function PaginationArrow ({href, direction, isDisabled}: {href: string, direction: 'left' | 'right', isDisabled?: boolean}) {
    const className = clsx(
        'flex h-10 w-10 items-center justify-center rounded-md border',
        {
            'pointer-events-none text-gray-300': isDisabled,
            'hover:bg-gray-100': !isDisabled,
            'mr-2 md:mr-4': direction === 'left',
            'ml-2 md:ml-4': direction === 'right'
        }
    );

    const icon = direction === 'left' ? (
        <ArrowLeftIcon className="w-4"/>
    ) : (
        <ArrowRightIcon className="w-4"/>
    )

    return isDisabled ? (
        <div className={className}>{icon}</div>
    ) : (
        <Link className={className} href={href}>
            {icon}
        </Link>
    );
}
export default Pagination;
