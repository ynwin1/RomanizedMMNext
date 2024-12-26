"use client";
import React from 'react'
import {useTranslations} from "next-intl";

const AboutContent = () => {
    const translator = useTranslations("HomePage");
    return (
        <>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                {translator("title")}
            </h2>
            <h4 className="text-lg md:text-2xl lg:text-3xl font-medium">
                {translator("subtitle")}
            </h4>
        </>
    )
}
export default AboutContent
