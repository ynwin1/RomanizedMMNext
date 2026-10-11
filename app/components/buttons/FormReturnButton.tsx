"use client";
import Link from "next/link";
import {useLocale} from "next-intl";

const FormReturnButton = ({url, label = "Return"}: {url: string; label?: string}) => {
    const locale = useLocale();

    return (
        <Link
            href={`/${locale}${url}`}
            className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
            {label}
        </Link>
    )
}
export default FormReturnButton
