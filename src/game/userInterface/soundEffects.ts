// audio/laserSound.ts
let _ctx: AudioContext | null = null;
export function getAudioContext() {
    if (_ctx) return _ctx!;
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return _ctx!;
}

type BeamOpts = { duration?: number; gain?: number; punch?: number };

export function playEnergyBeam(opts: BeamOpts = {}) {
    const duration = Math.max(0.3, opts.duration ?? 0.9);
    const gain = Math.min(1, Math.max(0, opts.gain ?? 0.7));
    const punch = Math.min(1, Math.max(0, opts.punch ?? 0.7));

    const ctx = getAudioContext();
    const t0 = ctx.currentTime;
    const tEnd = t0 + duration;
    const tAtk = t0 + 0.01;
    const tBody = t0 + duration * 0.6;

    // --- Master with gentle limiter ---
    const master = ctx.createGain();
    master.gain.value = 0.0001;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -10; comp.knee.value = 24; comp.ratio.value = 6;
    comp.attack.value = 0.004; comp.release.value = 0.12;

    master.connect(comp); comp.connect(ctx.destination);

    // --- Core beam: dual osc (triangle + saw) with modest detune ---
    const tri = ctx.createOscillator(); tri.type = "triangle";
    const saw = ctx.createOscillator(); saw.type = "sawtooth"; saw.detune.value = +9; // cents

    // Pitch path: assertive mid → slight rise → settle (no whistle)
    tri.frequency.setValueAtTime(520, t0);
    tri.frequency.exponentialRampToValueAtTime(900, t0 + duration * 0.2);
    tri.frequency.exponentialRampToValueAtTime(720, tEnd);

    saw.frequency.setValueAtTime(520, t0);
    saw.frequency.exponentialRampToValueAtTime(900, t0 + duration * 0.2);
    saw.frequency.exponentialRampToValueAtTime(720, tEnd);

    // Filter stack: HP to remove mud, LP sweep for “charging” feel, notch shimmer
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.Q.value = 0.7;
    hp.frequency.setValueAtTime(220, t0);
    hp.frequency.linearRampToValueAtTime(280, tEnd);

    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 0.9;
    lp.frequency.setValueAtTime(1600, t0);
    lp.frequency.linearRampToValueAtTime(2400, tBody);
    lp.frequency.linearRampToValueAtTime(1400, tEnd);

    const notch = ctx.createBiquadFilter(); notch.type = "notch"; notch.Q.value = 10;
    notch.frequency.setValueAtTime(1150, t0);
    notch.frequency.linearRampToValueAtTime(1350, tEnd); // subtle “moving air”

    // Mild soft clip to keep it firm, not harsh
    const shaper = ctx.createWaveShaper(); shaper.curve = softClip(0.45);

    const toneGain = ctx.createGain();
    toneGain.gain.setValueAtTime(0.0001, t0);
    toneGain.gain.exponentialRampToValueAtTime(0.55 * gain, tAtk);         // quick in
    toneGain.gain.exponentialRampToValueAtTime(0.32 * gain, t0 + 0.12);     // settle
    toneGain.gain.setValueAtTime(0.32 * gain, tBody);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, tEnd);               // out

    tri.connect(hp); saw.connect(hp);
    hp.connect(lp); lp.connect(notch); notch.connect(shaper); shaper.connect(toneGain);
    toneGain.connect(master);

    // --- Air layer: tight, non-hissy noise band ---
    const n = bufferNoise(ctx, duration);
    const noise = ctx.createBufferSource(); noise.buffer = n;
    const nHP = ctx.createBiquadFilter(); nHP.type = "highpass"; nHP.frequency.value = 900;
    const nBP = ctx.createBiquadFilter(); nBP.type = "bandpass"; nBP.Q.value = 4.5;
    nBP.frequency.setValueAtTime(2200, t0);
    nBP.frequency.linearRampToValueAtTime(2600, tEnd);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.0001, t0);
    nGain.gain.exponentialRampToValueAtTime(0.12 * gain, t0 + 0.02);
    nGain.gain.exponentialRampToValueAtTime(0.05 * gain, tBody);
    nGain.gain.exponentialRampToValueAtTime(0.0001, tEnd);

    noise.connect(nHP); nHP.connect(nBP); nBP.connect(nGain); nGain.connect(master);

    // --- Punch: extremely short, focused transient without boom ---
    const thump = ctx.createOscillator(); thump.type = "sine";
    thump.frequency.setValueAtTime(230, t0);
    thump.frequency.exponentialRampToValueAtTime(170, t0 + 0.08);

    const thumpBP = ctx.createBiquadFilter(); thumpBP.type = "bandpass"; thumpBP.Q.value = 1.1;
    thumpBP.frequency.value = 190;

    const thumpHP = ctx.createBiquadFilter(); thumpHP.type = "highpass"; thumpHP.frequency.value = 120;

    const thumpGain = ctx.createGain();
    thumpGain.gain.setValueAtTime(0.0001, t0);
    thumpGain.gain.exponentialRampToValueAtTime(0.40 * punch, t0 + 0.005);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.10);

    thump.connect(thumpBP); thumpBP.connect(thumpHP); thumpHP.connect(thumpGain); thumpGain.connect(master);

    // --- Start/stop
    tri.start(t0); saw.start(t0); noise.start(t0); thump.start(t0);
    tri.stop(tEnd); saw.stop(tEnd); noise.stop(tEnd); thump.stop(t0 + 0.12);

    // Master envelope last (prevents clicks)
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(0.9 * gain, t0 + 0.008);
    master.gain.exponentialRampToValueAtTime(0.0001, tEnd);

    // Helpers
    function bufferNoise(ctx: AudioContext, secs: number) {
        const len = Math.ceil(ctx.sampleRate * secs);
        const b = ctx.createBuffer(1, len, ctx.sampleRate);
        const ch = b.getChannelData(0);
        for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
        return b;
    }
    function softClip(amount: number) {
        const n = 1024, curve = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const x = (i / (n - 1)) * 2 - 1;
            curve[i] = Math.tanh(x * (1 + amount * 10));
        }
        return curve;
    }
}
