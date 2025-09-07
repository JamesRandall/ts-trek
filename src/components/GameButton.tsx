import React from "react";

type Props = {
    title?:string;
    color?:string;
    disabledColor?: string;
    onClick?: () => void;
    disabled?: boolean;
    isBlock?: boolean;
    isSquare?: boolean;
    children?: React.ReactNode;
    hasBorder?: boolean;
};

export default function GameButton({title, color, disabledColor, onClick, disabled, isBlock, children, isSquare, hasBorder} : Props) {
    const resolvedColor = color ?? "gamewhite";
    const resolvedBlock = isBlock ?? false ? "w-full block" : "inline-block";
    // tailwind-keep: text-gray-400 border-gray-400
    // tailwind-keep: disabled:text-gray-600 disabled:border-gray-600
    const resolvedDisabledColor = disabledColor ?? "gray-600";
    const sizing = isSquare ?? false ? " py-1 px-2" : "px-4 py-1";
    const border = hasBorder ?? true ? `border border-${resolvedColor}` : "";
    return (
        <button disabled={disabled ?? false} type="button" className={
            `cursor-pointer ${resolvedBlock} text-md font-orbitron  text-${resolvedColor} ${border} ${sizing} bg-black hover:bg-gray-800 disabled:bg-gray-900 disabled:text-${resolvedDisabledColor} disabled:border-${resolvedDisabledColor}`} onClick={onClick}>
            {title ?? children}
        </button>
    );
}