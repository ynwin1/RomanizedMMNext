"use client";
import React from 'react'
import {redirect} from "next/navigation";
import {useLocale} from "next-intl";

const FormReturnButton = ({url}: {url: string}) => {
    const locale = useLocale();

    return (
        <button
            className="bg-accent hover:bg-accent-hover text-on-accent font-bold py-2 px-4 rounded"
            onClick={() => redirect(`/${locale}${url}`)}
        >
            Return
        </button>
    )
}
export default FormReturnButton
