"use client";
import React from 'react';

const Biography = ({ biography }: { biography: string }) => {
    const [showMore, setShowMore] = React.useState(false);

    const toggleShowMore = () => {
        setShowMore(!showMore);
    };

    // Create a short version for the preview
    // Remove any \n characters for the short preview to make it cleaner
    const shortBiography = biography.slice(0, 280).replace(/\\n/g, ' ');

    // Parse markdown-style headings and paragraphs
    const renderFormattedBiography = (text: string) => {
        // Replace escaped \n with actual line breaks and then split
        const processedText = text.replace(/\\n/g, '\n');
        const lines = processedText.split('\n');
        
        // Process each line and build the JSX elements
        return lines.map((line, index) => {
            // Handle headings
            if (line.startsWith('# ')) {
                return <h1 key={index} className="text-3xl font-bold my-4">{line.substring(2)}</h1>;
            } else if (line.startsWith('## ')) {
                return <h2 key={index} className="text-2xl font-bold my-3">{line.substring(3)}</h2>;
            } else if (line.startsWith('### ')) {
                return <h3 key={index} className="text-xl font-bold my-2">{line.substring(4)}</h3>;
            }
            
            // Handle empty lines as paragraph breaks
            if (line.trim() === '') {
                return <br key={index} />;
            }
            
            // Regular paragraph text
            return <p key={index} className="text-muted-foreground text-lg leading-8 mb-4">{line}</p>;
        });
    };

    return (
        <div className="mt-8 gap-y-10 max-md:p-8">
            <h2 className="text-4xl font-bold mb-6">Biography</h2>
            <div className="biography-content">
                {showMore ? (
                    <div>{renderFormattedBiography(biography)}</div>
                ) : (
                    <>
                        <p className="text-muted-foreground leading-8 text-lg">{shortBiography}...</p>
                    </>
                )}
            </div>
            {biography.length > 200 && (
                <button 
                    onClick={toggleShowMore} 
                    className="text-white bg-blue-600 p-2 rounded-lg mt-4 hover:bg-blue-400 transition-all duration-300"
                >
                    {showMore ? "Show less" : "Show more"}
                </button>
            )}
        </div>
    );
};

export default Biography;
