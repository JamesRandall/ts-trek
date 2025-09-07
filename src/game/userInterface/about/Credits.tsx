import me from "../../../assets/me.jpeg";
import { useEffect, useState } from "react";

export function Credits() {
    const [isSpinning, setIsSpinning] = useState(true);

    useEffect(() => {
        // Stop the spinning animation after 5 seconds
        const timer = setTimeout(() => {
            setIsSpinning(false);
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="h-full w-full flex flex-col justify-center items-center gap-2">
            <img
                className="rounded-full mb-4"
                style={{
                    maxHeight: '33%',
                    animation: isSpinning ? 'spin-decelerate 5s ease-out forwards' : 'none'
                }}
                src={me}
                alt="Me!"
            />
            <div>Well it was written by me. Muggins here. <a className="text-red-500 hover:text-red-800" href="https://www.jamesdrandall.com">James Randall</a>. Just for fun really and to experiment with a visual style.</div>
            <div>Code is over on <a className="text-red-500 hover:text-red-800" href="https://github.com/jamesdrandall/ts-trek">GitHub</a>.</div>
            <div className="px-20 text-center">I'm indebted to the many other versions of this game created over the years. And of course to Star Trek itself. At least Star Trek before they turned into this mindless slop they do now which is Star Trek in name only. Which this game has zero affiliation with. Its NOT Star Trek. Ok!</div>

            <style>{`
                @keyframes spin-decelerate {
                    0% {
                        transform: rotate(0deg) scale(1.0);
                        animation-timing-function: ease-out;
                    }
                    100% {
                        transform: rotate(7200deg) scale(1.0);
                    }
                }
            `}</style>
        </div>
    )
}