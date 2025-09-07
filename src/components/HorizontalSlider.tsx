import type {RangedValue} from "../game/models/RangedValue.ts";
import {range as rangeIter} from "../game/utilities.ts";

type Props = {
    range:RangedValue;
    label?:string;
    showNumbers?:boolean;
    numberFormatter?: (value:RangedValue) => string;
    setValue?: (value:number) => void;
    numberOfSteps?: number;
}

export default function HorizontalSlider({range,label,showNumbers,numberFormatter,setValue,numberOfSteps}:Props) {
    // tailwind-keep: grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4 grid-cols-5 grid-cols-6 grid-cols-7 grid-cols-8 grid-cols-9 grid-cols-10
    numberOfSteps ??= 10;
    const stepSize = range.maxValue / (numberOfSteps);
    const gauge = (
        <div className={`grid grid-cols-${numberOfSteps} gap-1`}>
            {rangeIter(0,numberOfSteps-1).map(i =>
                <div
                    key={i}
                    className={`h-4 relative ${range.currentValue <= (stepSize * i) ? "bg-gray-700" : "bg-gamewhite" } `}
                    onClick={() => setValue?.((i+1) * stepSize)} />
            )}
        </div>
    );
    if (label !== undefined) {
        if (showNumbers ?? true) {
            const numberLabel = numberFormatter ? numberFormatter(range) : `${range.currentValue.toFixed(0)}/${range.maxValue}`;
            return <div className="flex flex-col  gap-1">
                <div className="flex flex-row justify-between">
                    <div>{label}</div>
                    <div>{numberLabel}</div>
                </div>
                {gauge}
            </div>
        }
        return <div className="flex flex-col  gap-1">{label}{gauge}</div>
    }
    return gauge;
}