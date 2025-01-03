"use client";
import {usePathname, useSearchParams} from "next/navigation";
import Link from "next/link";
import {useLocale} from "next-intl";

const ItemsPerPageSelector = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    // get items per page list based on limit type
    const currentLimit = Number(searchParams.get('limit')) || 10;
    const limitList = [10, 20, 30, 40, 50];

    const createItemsPerPageURL = (itemsPerPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('limit', itemsPerPage.toString());
        return `${pathname}?${params.toString()}`;
    }

    const locale = useLocale();
    const showText = locale === "en" ? `Show ${currentLimit} items` : `${currentLimit} ခုပြပါ`;

    return (
        <div className="flex flex-col items-center mt-8">
            <div className="relative">
                <div className="peer flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-900 rounded-full px-4 py-2 cursor-pointer">
                    <span className="text-sm font-lg">{showText}</span>
                </div>
                <div className="absolute z-10 mt-2 w-40 bg-gray-900 rounded-lg shadow-xl
                       opacity-0 invisible peer-hover:opacity-100 peer-hover:visible
                       hover:opacity-100 hover:visible
                       transition-all duration-200">
                    <div className="py-1">
                        {limitList.map((limit) => (
                            <Link
                                key={limit}
                                href={createItemsPerPageURL(limit)}
                                className={`block px-4 py-2 text-sm ${
                                    currentLimit === limit
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-800'
                                }`}
                            >
                                {limit}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
export default ItemsPerPageSelector