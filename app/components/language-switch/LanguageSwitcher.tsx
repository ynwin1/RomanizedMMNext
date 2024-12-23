import React from 'react'

function switchLanguage(lang: string) {
}

const LanguageSwitcher = () => {
    return (
        <div className="inline-flex rounded-md shadow-sm" role="group">
            <button type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-900 bg-transparent border border-gray-900 rounded-s-lg hover:bg-gray-900 hover:text-white focus:z-10 focus:ring-2 focus:ring-gray-500 focus:bg-gray-900 focus:text-white dark:border-white dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:bg-gray-700"

            >
                English
            </button>
            <button type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-900 bg-transparent border-t border-b border-gray-900 hover:bg-gray-900 hover:text-white focus:z-10 focus:ring-2 focus:ring-gray-500 focus:bg-gray-900 focus:text-white dark:border-white dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:bg-gray-700"

            >
                မြန်မာ
            </button>
        </div>
    )
}
export default LanguageSwitcher
