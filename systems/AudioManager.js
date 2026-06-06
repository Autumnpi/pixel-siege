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
            const bi  = this._bgmTick % pat.bass.length;
            const mi  = this._bgmTick % pat.melody.length;
            const dur = pat.stepMs / 1000;

            if (pat.bass[bi])
                this._noteOsc('square',   pat.bass[bi],   0.20, dur * 0.85, t, this.bgmGain);
            if (pat.melody[mi])
                this._noteOsc('triangle', pat.melody[mi], 0.13, dur * 0.65, t, this.bgmGain);
            // Counter-melody kicks in on wave 2+
            if (this._bgmWave >= 2 && pat.counter[mi])
                this._noteOsc('sine', pat.counter[mi], 0.07, dur * 0.5, t, this.bgmGain);
            // Extra percussion layer on wave 3+
            if (this._bgmWave >= 3 && bi % 4 === 0)
                this._noiseBurst(0.06, dur * 0.08, t, this.bgmGain);

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

    // ── BGM patterns ────────────────────────────────────────────
    _bgmPatterns = {
        // Chapter 1 — A minor, moody (136 BPM 8th notes)
        ch1: {
            stepMs: 220,
            bass:    [110,0,0,0, 82.41,0,0,0, 87.31,0,0,0, 98,0,0,0],
            melody:  [329.63,0,392,0,   440,0,392,0,
                      349.23,0,329.63,0, 261.63,0,0,0,
                      293.66,0,329.63,0, 392,0,440,0,
                      493.88,0,440,0,   392,0,329.63,0],
            counter: [0,0,0,0,659.25,0,0,0,
                      0,0,0,0,523.25,0,0,0,
                      0,0,0,0,587.33,0,0,0,
                      0,0,0,0,659.25,0,0,0],
        },
        // Chapter 2 — D minor, urgent (154 BPM)
        ch2: {
            stepMs: 195,
            bass:    [73.42,0,0,0, 87.31,0,0,0, 110,0,0,0, 116.54,0,0,0],
            melody:  [349.23,0,440,0,    587.33,0,523.25,0,
                      440,0,392,0,       349.23,0,329.63,0,
                      293.66,0,349.23,0, 392,0,440,0,
                      493.88,0,587.33,0, 466.16,0,440,0],
            counter: [0,0,0,0,880,0,0,0,
                      0,0,0,0,783.99,0,0,0,
                      0,0,0,0,880,0,0,0,
                      0,0,0,0,987.77,0,0,0],
        },
        // Chapter 3 — E minor, intense (171 BPM)
        ch3: {
            stepMs: 175,
            bass:    [82.41,0,0,0, 98,0,0,0, 123.47,0,0,0, 130.81,0,0,0],
            melody:  [392,0,493.88,0,   659.25,0,493.88,0,
                      392,0,369.99,0,   329.63,0,293.66,0,
                      261.63,0,293.66,0, 329.63,0,369.99,0,
                      392,0,440,0,       493.88,0,659.25,0],
            counter: [0,0,659.25,0,0,0,987.77,0,
                      0,0,783.99,0,0,0,659.25,0,
                      0,0,523.25,0,0,0,659.25,0,
                      0,0,783.99,0,0,0,987.77,0],
        },
        // Boss — slow, ominous (100 BPM)
        boss: {
            stepMs: 300,
            bass:    [55,0,0,0,0,0,0,0, 58.27,0,0,0,0,0,0,0],
            melody:  [220,0,0,0,   261.63,0,0,0,
                      311.13,0,0,0, 329.63,0,0,0,
                      392,0,0,0,   349.23,0,0,0,
                      311.13,0,0,0, 220,0,0,0],
            counter: [0,0,0,0,440,0,0,0,
                      0,0,0,0,659.25,0,0,0,
                      0,0,0,0,587.33,0,0,0,
                      0,0,0,0,440,0,0,0],
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
            // Low boom
            const osc = this.ctx.createOscillator();
            const g   = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, t);
            osc.frequency.exponentialRampToValueAtTime(40, t + 0.45);
            g.gain.setValueAtTime(0.5, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
            osc.connect(g).connect(this.sfxGain);
            osc.start(t); osc.stop(t + 0.46);
            // High zip
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
            this._noteOsc('square', 523.25, 0.2, 0.08, t,      this.sfxGain);
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
