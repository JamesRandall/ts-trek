import React from "react";

type Props = {
    borderColor: string,
    children?: React.ReactNode,
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
    width?: number;
    isTransparentBackground?: boolean;
}

export function OverlayPanel({borderColor, children, onClick, width, isTransparentBackground}: Props) {
    const style = width ? { width:width } : undefined;
    const transparentBackground = (isTransparentBackground ?? false) ? "opacity-80" : "";
    return (
        <div className="border-2 border-black font-orbitron" onClick={(ev) => onClick?.(ev) } style={style}>
            <div className={`border border-${borderColor} relative`}>
                <div className={`absolute inset-0 bg-black z-10 ${transparentBackground}`} />
                <div className="relative z-20">{children}</div>
            </div>
        </div>
    )
}