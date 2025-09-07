
export class Colors {
    static readonly gameWhite = 'rgb(232,227,221)';
    static readonly gameWhiteMid = 'rgb(180,174,168)';
    static readonly gameWhiteDark = 'rgb(128,122,116)';
    static readonly gaugeBackground = 'rgb(54,65,83)';
    static readonly gaugeWarning = 'oklch(70.5% 0.213 47.604)'; // bg-orange-500
    static readonly gaugeWarningBackground = 'oklch(28.6% 0.066 53/813)'; // bg-yellow-950
    static readonly gaugeCritical = 'oklch(63.7% 0.213 25.331)'; // bg-red-500
    static readonly gaugeCriticalBackground = 'oklch(25.8% 0.092 26.042)'; // bg-red-950
}

export class Map {
    static readonly quadrantSize = { width: 8, height: 8 };
    static readonly sectorSize = { width: 8, height: 8 };
}

export class Rules {
    static readonly criticalDamageThreshold = 0.2;
    static readonly maximumTargets = 3;
}