class AudioManager {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.sfxGain = null;
        this.bgmGain = null;
        this._bgmInterval = null;
        this._bgmTick = 0;
        this._bgmRunning = false;
        this._bgmWave = 1;
        this._muted = false;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.6;
        this.master.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.7;
        this.sfxGain.connect(this.master);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = 0.32;
        this.bgmGain.connect(this.master);
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    play(key) {
        if (!this.ctx || this._muted) return;
        this.resume();
        const fn = this._sounds[key];
        if (fn) fn.call(this);
    }

    setWave(waveNum) {
        this._bgmWave = waveNum;
    }

    startBGM(levelNum = 1) {
        if (!this.ctx || this._bgmRunning) return;
        this._bgmRunning = true;
        this._bgmTick = 0;
        this._bgmWave = 1;

        const isBoss = levelNum > 0 && levelNum % 3 === 0;
        const chapter = Math.min(Math.ceil(levelNum / 3), 3);
        const patKey  = isBoss ? 'boss' : `ch${chapter}`;
        const pat = this._bgmPatterns[patKey];

        this._bgmInterval = setInterval(() => {
            if (!this.ctx || this._muted) return;
            const t   = this.ctx.currentTime;
            const dur = pat.stepMs / 1000;
            const bi  = this._bgmTick % pat.bass.length;
            const mi  = this._bgmTick % pat.melody.length;
            const ai  = this._bgmTick % pat.arp.length;
            const ci  = this._bgmTick % pat.counter.length;

            // Bass: square wave, punchy
            if (pat.bass[bi])
                this._noteOsc('square',   pat.bass[bi],    0.18, dur * 0.7,  t, this.bgmGain);
            // Melody: long sustained triangle pad (the main 80s synth sound)
            if (pat.melody[mi])
                this._noteOsc('triangle', pat.melody[mi],  0.13, dur * 6.5,  t, this.bgmGain);
            // Arpeggio: fast staccato sine (glassy 80s arp texture)
            if (pat.arp[ai])
                this._noteOsc('sine',     pat.arp[ai],     0.05, dur * 0.4,  t, this.bgmGain);
            // Counter-melody: harmony 3rds, appears on wave 2+
            if (this._bgmWave >= 2 && pat.counter[ci])
                this._noteOsc('sine',     pat.counter[ci], 0.06, dur * 5.5,  t, this.bgmGain);
            // Percussion accent on wave 3+
            if (this._bgmWave >= 3 && bi % 4 === 0)
                this._noiseBurst(0.05, dur * 0.1, t, this.bgmGain);

            this._bgmTick++;
        }, pat.stepMs);
    }

    stopBGM() {
        clearInterval(this._bgmInterval);
        this._bgmInterval = null;
        this._bgmRunning  = false;
    }

    setMuted(muted) {
        this._muted = muted;
        if (this.master) this.master.gain.value = muted ? 0 : 0.6;
    }

    // ── BGM patterns ──────────────────────────────────────────────
    // 80s sci-fi synth style: major/mixolydian/dorian modes.
    // Three voices per pattern:
    //   bass    (16 steps, quarter notes)  — loops every 2 s at 125ms step
    //   melody  (64 steps, half notes, long sustain) — loops every 8 s
    //   arp     (16 steps, 16th notes, staccato) — fast chord arpeggio texture
    //   counter (64 steps, half notes) — parallel 3rds harmony, wave 2+
    _bgmPatterns = {
        // Chapter 1 — D Major "Sector Alpha" (120 BPM, 125 ms / 16th note)
        // Bass: D2 A2 G2 A2 (I–V–IV–V pattern)
        // Melody: D5→B4→A4→G4→F#4→A4→B4→D5 (major descending arc)
        ch1: {
            stepMs: 125,
            bass: [73.42,0,0,0, 110,0,0,0, 98,0,0,0, 110,0,0,0],
            melody: [
                587.33,0,0,0,0,0,0,0,  // D5
                493.88,0,0,0,0,0,0,0,  // B4
                440,   0,0,0,0,0,0,0,  // A4
                392,   0,0,0,0,0,0,0,  // G4
                369.99,0,0,0,0,0,0,0,  // F#4
                440,   0,0,0,0,0,0,0,  // A4
                493.88,0,0,0,0,0,0,0,  // B4
                587.33,0,0,0,0,0,0,0,  // D5
            ],
            // Fast arpeggio cycling chord tones each quarter note
            arp: [
                293.66,369.99,440,587.33,   // D4 F#4 A4 D5 (D major)
                220,   277.18,329.63,440,   // A3 C#4 E4 A4 (A major)
                196,   246.94,293.66,392,   // G3 B3 D4 G4 (G major)
                329.63,440,   554.37,659.25, // E4 A4 C#5 E5 (A major hi)
            ],
            // Parallel 3rds below melody: B4 G4 F#4 E4 D4 F#4 G4 B4
            counter: [
                493.88,0,0,0,0,0,0,0,  // B4
                392,   0,0,0,0,0,0,0,  // G4
                369.99,0,0,0,0,0,0,0,  // F#4
                329.63,0,0,0,0,0,0,0,  // E4
                293.66,0,0,0,0,0,0,0,  // D4
                369.99,0,0,0,0,0,0,0,  // F#4
                392,   0,0,0,0,0,0,0,  // G4
                493.88,0,0,0,0,0,0,0,  // B4
            ],
        },

        // Chapter 2 — A Dorian "Deep Space" (130 BPM, 115 ms / 16th note)
        // Dorian = natural minor with raised 6th (F#) — bright, mysterious, classic 80s sci-fi
        // Bass: A2 E3 D3 G3 (i–V–IV–VII)
        // Melody: A4→C5→E5→D5→C5→B4→F#4→A4 (Dorian ascent then resolve)
        ch2: {
            stepMs: 115,
            bass: [110,0,0,0, 164.81,0,0,0, 146.83,0,0,0, 196,0,0,0],
            melody: [
                440,   0,0,0,0,0,0,0,  // A4
                523.25,0,0,0,0,0,0,0,  // C5
                659.25,0,0,0,0,0,0,0,  // E5
                587.33,0,0,0,0,0,0,0,  // D5
                523.25,0,0,0,0,0,0,0,  // C5
                493.88,0,0,0,0,0,0,0,  // B4
                369.99,0,0,0,0,0,0,0,  // F#4 (Dorian brightness)
                440,   0,0,0,0,0,0,0,  // A4
            ],
            // Chord arpeggios: Am, Em, Dm, Gm
            arp: [
                220,   261.63,329.63,440,    // A3 C4 E4 A4 (Am)
                164.81,196,   246.94,329.63, // E3 G3 B3 E4 (Em)
                146.83,184.99,220,   293.66, // D3 F#3 A3 D4 (D major — Dorian IV!)
                196,   246.94,293.66,392,    // G3 B3 D4 G4 (G major)
            ],
            // Parallel 3rds below: F#4 A4 C5 B4 A4 G4 D4 F#4
            counter: [
                369.99,0,0,0,0,0,0,0,  // F#4
                440,   0,0,0,0,0,0,0,  // A4
                523.25,0,0,0,0,0,0,0,  // C5
                493.88,0,0,0,0,0,0,0,  // B4
                440,   0,0,0,0,0,0,0,  // A4
                392,   0,0,0,0,0,0,0,  // G4
                293.66,0,0,0,0,0,0,0,  // D4
                369.99,0,0,0,0,0,0,0,  // F#4
            ],
        },

        // Chapter 3 — B Major "Final Sector" (140 BPM, 107 ms / 16th note)
        // Pure major — heroic, epic, climactic
        // Bass: B2 F#3 E3 G#3 (I–V–IV–VI)
        // Melody: B4→D#5→F#5→E5→C#5→G#4→F#4→B4 (dramatic B major ascent)
        ch3: {
            stepMs: 107,
            bass: [123.47,0,0,0, 184.99,0,0,0, 164.81,0,0,0, 207.65,0,0,0],
            melody: [
                493.88,0,0,0,0,0,0,0,  // B4
                622.25,0,0,0,0,0,0,0,  // D#5
                739.99,0,0,0,0,0,0,0,  // F#5
                659.25,0,0,0,0,0,0,0,  // E5
                554.37,0,0,0,0,0,0,0,  // C#5
                415.3, 0,0,0,0,0,0,0,  // G#4
                369.99,0,0,0,0,0,0,0,  // F#4
                493.88,0,0,0,0,0,0,0,  // B4
            ],
            // Chord arpeggios: B, F#, E, G#m
            arp: [
                246.94,311.13,369.99,493.88,  // B3 D#4 F#4 B4 (B major)
                184.99,233.08,277.18,369.99,  // F#3 A#3 C#4 F#4 (F# major)
                164.81,207.65,246.94,329.63,  // E3 G#3 B3 E4 (E major)
                207.65,246.94,311.13,415.3,   // G#3 B3 D#4 G#4 (G#m)
            ],
            // Parallel 3rds below: G#4 B4 D#5 C#5 A#4 E4 D#4 G#4
            counter: [
                415.3, 0,0,0,0,0,0,0,  // G#4
                493.88,0,0,0,0,0,0,0,  // B4
                622.25,0,0,0,0,0,0,0,  // D#5
                554.37,0,0,0,0,0,0,0,  // C#5
                466.16,0,0,0,0,0,0,0,  // A#4
                329.63,0,0,0,0,0,0,0,  // E4
                311.13,0,0,0,0,0,0,0,  // D#4
                415.3, 0,0,0,0,0,0,0,  // G#4
            ],
        },

        // Boss — C Harmonic Minor "Confrontation" (90 BPM, 167 ms / 16th note)
        // Harmonic minor with B natural leading tone: tense, cinematic, Blade Runner-ish
        // Bass: C2 (very long, 8 steps) Ab2 (very long) — slow and ominous
        // Melody: C5→B4→Ab4→G4 (descending into tension)
        boss: {
            stepMs: 167,
            bass: [65.41,0,0,0,0,0,0,0, 103.83,0,0,0,0,0,0,0],
            melody: [
                523.25,0,0,0,0,0,0,0,  // C5
                493.88,0,0,0,0,0,0,0,  // B4 (leading tone — harmonic minor)
                415.3, 0,0,0,0,0,0,0,  // Ab4
                392,   0,0,0,0,0,0,0,  // G4
            ],
            // Tense chromatic arpeggios: Cm, Cm, F/Ab, Cm+B (leading tone)
            arp: [
                261.63,311.13,392,   523.25,  // C4 Eb4 G4 C5 (Cm)
                261.63,311.13,392,   523.25,  // C4 Eb4 G4 C5 (Cm repeat)
                261.63,349.23,415.3, 523.25,  // C4 F4 Ab4 C5 (Fm/Ab variant)
                261.63,311.13,493.88,523.25,  // C4 Eb4 B4 C5 (B natural tension!)
            ],
            // Counter 3rds below: Ab4 G4 F4 Eb4
            counter: [
                415.3, 0,0,0,0,0,0,0,  // Ab4
                392,   0,0,0,0,0,0,0,  // G4
                349.23,0,0,0,0,0,0,0,  // F4
                311.13,0,0,0,0,0,0,0,  // Eb4
            ],
        },
    };

    // ── Primitives ──────────────────────────────────────────────
    _noteOsc(type, freq, volume, duration, startTime, destination) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const g   = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        g.gain.setValueAtTime(volume, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(g).connect(destination || this.sfxGain);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.01);
    }

    _noiseBurst(volume, duration, startTime, destination) {
        if (!this.ctx) return;
        const bufSize = Math.floor(this.ctx.sampleRate * duration);
        const buf  = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(volume, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        src.connect(g).connect(destination || this.sfxGain);
        src.start(startTime);
        src.stop(startTime + duration + 0.01);
    }

    // ── Sound effects ───────────────────────────────────────────
    _sounds = {
        shoot() {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g   = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(900, t);
            osc.frequency.exponentialRampToValueAtTime(250, t + 0.07);
            g.gain.setValueAtTime(0.25, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            osc.connect(g).connect(this.sfxGain);
            osc.start(t); osc.stop(t + 0.09);
        },

        charge_ready() {
            const t = this.ctx.currentTime;
            [523.25, 659.25, 783.99].forEach((freq, i) => {
                this._noteOsc('sine', freq, 0.18, 0.1, t + i * 0.07, this.sfxGain);
            });
        },

        charge_shoot() {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g   = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, t);
            osc.frequency.exponentialRampToValueAtTime(40, t + 0.45);
            g.gain.setValueAtTime(0.5, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
            osc.connect(g).connect(this.sfxGain);
            osc.start(t); osc.stop(t + 0.46);
            const osc2 = this.ctx.createOscillator();
            const g2   = this.ctx.createGain();
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(1400, t);
            osc2.frequency.exponentialRampToValueAtTime(280, t + 0.22);
            g2.gain.setValueAtTime(0.22, t);
            g2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
            osc2.connect(g2).connect(this.sfxGain);
            osc2.start(t); osc2.stop(t + 0.23);
        },

        enemy_die() {
            const t = this.ctx.currentTime;
            this._noiseBurst(0.35, 0.18, t, this.sfxGain);
        },

        player_hit() {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g   = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, t);
            osc.frequency.exponentialRampToValueAtTime(55, t + 0.25);
            g.gain.setValueAtTime(0.4, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
            osc.connect(g).connect(this.sfxGain);
            osc.start(t); osc.stop(t + 0.26);
        },

        level_complete() {
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
            notes.forEach((freq, i) => {
                const t = this.ctx.currentTime + i * 0.13;
                this._noteOsc('square', freq, 0.3, 0.11, t, this.sfxGain);
            });
        },

        game_over() {
            const notes = [440, 369.99, 311.13, 261.63, 220];
            notes.forEach((freq, i) => {
                const t = this.ctx.currentTime + i * 0.18;
                this._noteOsc('sawtooth', freq, 0.3, 0.16, t, this.sfxGain);
            });
        },

        wave_clear() {
            const t = this.ctx.currentTime;
            this._noteOsc('square', 523.25, 0.2, 0.08, t,       this.sfxGain);
            this._noteOsc('square', 659.25, 0.2, 0.08, t + 0.1, this.sfxGain);
        },

        enemy_shoot() {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g   = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.exponentialRampToValueAtTime(120, t + 0.1);
            g.gain.setValueAtTime(0.15, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc.connect(g).connect(this.sfxGain);
            osc.start(t); osc.stop(t + 0.11);
        },

        timer_expired() {
            const t = this.ctx.currentTime;
            for (let i = 0; i < 3; i++) {
                const osc = this.ctx.createOscillator();
                const g   = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(880, t + i * 0.25);
                osc.frequency.setValueAtTime(440, t + i * 0.25 + 0.12);
                g.gain.setValueAtTime(0.3, t + i * 0.25);
                g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.25 + 0.23);
                osc.connect(g).connect(this.sfxGain);
                osc.start(t + i * 0.25);
                osc.stop(t + i * 0.25 + 0.24);
            }
        },
    };
}
