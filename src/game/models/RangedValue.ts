import * as GameConstants from '../gameConstants.ts';

export type RangedValue = {
    rehydrationType: string;
    currentValue: number;
    readonly maxValue: number;
    readonly minValue: number;

    readonly percentageString: () => string;
    readonly percentage: () => number;
    readonly fraction: () => number;
    readonly color: () => string;
}

export function createRangedValue(value: number, maxValue?: number, minValue?: number) : RangedValue {
    return {
        rehydrationType: 'RangedValue',
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

export function patchRangedValues(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
            obj[index] = patchRangedValues(item);
        });
        return obj;
    }

    // Check if this object is a RangedValue that needs patching
    if (obj.rehydrationType === 'RangedValue') {
        // Mutate the object in-place by adding the missing functions
        obj.percentageString = function() {
            const percentage = (this.currentValue / this.maxValue) * 100;
            return `${percentage.toFixed(0)}%`;
        };
        obj.percentage = function () {
            return this.fraction() * 100;
        };
        obj.fraction = function() {
            return this.currentValue / this.maxValue;
        };
        obj.color = function () {
            if (this.percentage() < 15) {
                return GameConstants.Colors.gaugeCritical;
            } else if (this.currentValue < 30) {
                return GameConstants.Colors.gaugeWarning;
            } else {
                return GameConstants.Colors.gameWhite;
            }
        };
        return obj;
    }

    // Recursively patch nested objects
    for (const [key, value] of Object.entries(obj)) {
        obj[key] = patchRangedValues(value);
    }

    return obj;
}



export function patchRangedValue(value: { rehydrationType: string, currentValue: number, maxValue: number, minValue: number}) : RangedValue {
    return {
        ...value,
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
