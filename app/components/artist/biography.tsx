"use client";
import React from 'react';

const Biography = ({ biography, locale = "en" }: { biography: string; locale?: string }) => {
    const [showMore, setShowMore] = React.useState(false);

    const toggleShowMore = () => {
        setShowMore(!showMore);
    };

    // Create a short version for the preview
    // Remove any \n characters for the short preview to make it cleaner
    const normalizedBiography = biography.replace(/\\n/g, '\n');
    const needsTruncation = normalizedBiography.length > 320;
    const shortBiography = normalizedBiography.slice(0, 320).replace(/\s+/g, ' ').trim();

    // Parse markdown-style headings and paragraphs
    const renderFormattedBiography = (text: string) => {
        // Replace escaped \n with actual line breaks and then split
        const processedText = text.replace(/\\n/g, '\n');
        const lines = processedText.split('\n');
        
        // Process each line and build the JSX elements
        return lines.map((line, index) => {
            // Handle headings
            if (line.startsWith('# ')) {
                return <h3 key={index} className="my-4 text-xl font-bold text-foreground">{line.substring(2)}</h3>;
            } else if (line.startsWith('## ')) {
                return <h3 key={index} className="my-3 text-lg font-bold text-foreground">{line.substring(3)}</h3>;
            } else if (line.startsWith('### ')) {
                return <h4 key={index} className="my-2 text-base font-bold text-foreground">{line.substring(4)}</h4>;
            }
            
            // Handle empty lines as paragraph breaks
            if (line.trim() === '') {
                return <br key={index} />;
            }
            
            // Regular paragraph text
            return <p key={index} className="mb-4 whitespace-pre-wrap text-sm leading-7 text-muted sm:text-base">{line}</p>;
        });
    };

    return (
        <div>
            <h2 className="mb-5 text-2xl font-bold sm:text-3xl">{locale === "my" ? "အတ္ထုပ္ပတ္တိ" : "Biography"}</h2>
            <div className="biography-content">
                {showMore || !needsTruncation ? (
                    <div>{renderFormattedBiography(biography)}</div>
                ) : (
                    <>
                        <p className="text-sm leading-7 text-muted sm:text-base">{shortBiography}…</p>
                    </>
                )}
            </div>
            {needsTruncation && (
                <button 
                    onClick={toggleShowMore} 
                    type="button"
                    aria-expanded={showMore}
                    className="mt-4 min-h-11 rounded-lg border border-theme-border bg-surface-raised px-4 text-sm font-semibold text-foreground hover:border-accent hover:text-accent"
                >
                    {locale === "my" ? (showMore ? "လျှော့ပြရန်" : "ဆက်ဖတ်ရန်") : (showMore ? "Show less" : "Read more")}
                </button>
            )}
        </div>
    );
};

export default Biography;
