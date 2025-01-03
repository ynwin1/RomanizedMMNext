import React from 'react'
import {useLocale} from "next-intl";
import {usePathname, useRouter, useSearchParams} from "next/navigation";

const LanguageSwitcher = () => {
    const locale = useLocale();
    const {replace} = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    function switchLanguage(lang: string) {
        if (lang === locale) return;

        // Set new language
        const segments = pathname.split('/').filter(Boolean);
        segments[0] = lang;

        // Reconstruct the URL
        const newUrl = `/${segments.join('/')}${searchParams ? `?${searchParams.toString()}` : ''}`;

        replace(newUrl, {scroll: false});
    }

    return (
        <div className="inline-flex rounded-md shadow-sm" role="group">
            <button type="button"
                    className="px-5 py-2.5 text-lg font-medium text-white bg-transparent border border-white rounded-s-lg hover:bg-gray-900 hover:text-white focus:z-10 focus:ring-2 focus:ring-gray-500 focus:bg-gray-900 focus:text-white dark:border-white dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                    onClick={() => switchLanguage('en')}
            >
                English
            </button>
            <button type="button"
                    className="px-5 py-2.5 text-lg font-medium text-white bg-transparent border border-white rounded-e-lg hover:bg-gray-900 hover:text-white focus:z-10 focus:ring-2 focus:ring-gray-500 focus:bg-gray-900 focus:text-white dark:border-white dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                    onClick={() => switchLanguage('my')}
            >
                မြန်မာ
            </button>
        </div>
    )
}
export default LanguageSwitcher;
