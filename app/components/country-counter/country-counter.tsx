"use client";
import React from 'react'
import { useEffect} from "react";

const CountryCounter = () => {
    useEffect(() => {
        const trackCountry = async () => {
            const alreadyTracked: boolean = document.cookie.includes("countryTracked=true");
            if (alreadyTracked) return;

            try {
                const resp = await fetch("https://ipapi.co/json/");
                const data = await resp.json();
                const country = data.country_name || "Unknown";
                const country_code = data.country_code || "Unknown";

                await fetch("/api/track-country", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ country, country_code }),
                })

                document.cookie = "countryTracked=true; max-age=3600; path=/";
            } catch (error) {
                console.error("Error tracking country: ", error);
            }
        };
        trackCountry();
    }, []);

    return null;
}
export default CountryCounter
