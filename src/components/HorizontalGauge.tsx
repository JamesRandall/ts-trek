import type {RangedValue} from "../game/models/RangedValue.ts";
import React, { useEffect, useRef, useState } from "react";

type Props = {
    range:RangedValue;
    label?:string;
    showNumbers?:boolean;
    numberFormatter?: (value:RangedValue) => string;
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
    labelClassName?: string;
    isBroken?: boolean;
}

export default function HorizontalGauge({range,label,showNumbers,numberFormatter,onClick,labelClassName,isBroken}:Props) {
    const [animatedPercentage, setAnimatedPercentage] = useState(range.percentage());
    const previousPercentageRef = useRef(range.percentage());
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const currentPercentage = range.percentage();

        if (currentPercentage !== previousPercentageRef.current) {
            const startPercentage = previousPercentageRef.current;
            const endPercentage = currentPercentage;
            const startTime = performance.now();
            const duration = 500; // Animation duration in milliseconds

            // Cancel any existing animation
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease-out function for smoother animation
                const easedProgress = 1 - Math.pow(1 - progress, 3);

                const currentValue = startPercentage + (endPercentage - startPercentage) * easedProgress;
                setAnimatedPercentage(currentValue);

                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(animate);
                } else {
                    animationRef.current = null;
                }
            };

            animationRef.current = requestAnimationFrame(animate);
            previousPercentageRef.current = currentPercentage;
        }

        // Cleanup function
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [range]);

    const gauge = (
        <div className="relative w-full text-md h-4 bg-gray-700">
            <div
                className={`absolute h-full transition-none`}
                style={{
                    width: `${isBroken ? 0 : animatedPercentage.toFixed(1)}%`,
                    backgroundColor: range.color()
                }}
            />
        </div>
    );

    const layout = `flex flex-col gap-1 ${onClick ? 'cursor-pointer' : ''}`

    if (label !== undefined) {
        if (showNumbers ?? true) {
            const numberLabel = isBroken === true ? '???/???' : (
                numberFormatter ? numberFormatter(range) : `${range.currentValue.toFixed(0)}/${range.maxValue}`
            );
            return <div className={layout} onClick={onClick}>
                <div className="flex flex-row justify-between">
                    <div className={labelClassName}>{label}</div>
                    <div>{numberLabel}</div>
                </div>
                {gauge}
            </div>
        }
        return <div className={layout} onClick={onClick}><div className={labelClassName}>{label}</div>{gauge}</div>
    }
    return gauge;
}