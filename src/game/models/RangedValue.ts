import * as GameConstants from '../gameConstants.ts';

export type RangedValue = {
    currentValue: number;
    readonly maxValue: number;
    readonly minValue: number;

    readonly percentageString: () => string;
    readonly percentage: () => number;
    readonly fraction: () => number;
    readonly color: () => string;
}


export function createRangedValue(value: number, maxValue?: number, minValue?: number) {
    return {
        currentValue: value,
        maxValue: maxValue ?? value,
        minValue: minValue ?? 0,
        percentageString: function() {
            const percentage = (this.currentValue / this.maxValue) * 100;
            return `${percentage.toFixed(0)}%`;
        },
        percentage: function () {
            return this.fraction() * 100;
        },
        fraction: function() {
            return this.currentValue / this.maxValue;
        },
        color: function () {
            if (this.percentage() < 15) {
                return GameConstants.Colors.gaugeCritical;
            } else if (this.currentValue < 30) {
                return GameConstants.Colors.gaugeWarning;
            } else {
                return GameConstants.Colors.gameWhite;
            }
        },
    }
}

export function applyDeltaToRangedValue(rangedValue: RangedValue, delta: number) {
    rangedValue.currentValue = Math.max(rangedValue.minValue, Math.min(rangedValue.maxValue, rangedValue.currentValue + delta));
}

export function setRangedValue(rangedValue: RangedValue, newValue: number) {
    rangedValue.currentValue = Math.max(rangedValue.minValue, Math.min(rangedValue.maxValue, newValue));
}
