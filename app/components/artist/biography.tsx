"use client";
import React from 'react'

const Biography = ({ biography }: { biography: string }) => {
    const[showMore, setShowMore] = React.useState(false);

    const toggleShowMore = () => {
        setShowMore(!showMore);
    }

    const shortBiography = biography.slice(0, 200);

    return (
        <div className="mt-8 gap-y-10 max-md:p-8">
            <h2 className="text-4xl font-bold mb-6">Biography</h2>
            {showMore ?
                <p className="text-muted-foreground leading-8 text-lg">{biography}</p> :
                <p className="text-muted-foreground leading-8 text-lg">{shortBiography}...</p>
            }
            {biography.length > 200 &&
                <button onClick={toggleShowMore} className="text-white bg-blue-600 p-2 rounded-lg mt-4 hover:bg-blue-400 transition-all duration-300">
                    {showMore ? "Show less" : "Show more"}
                </button>
            }
        </div>
    )
}
export default Biography
