class AudioManager {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.sfxGain = null;
        this.bgmGain = null;
        this._bgmInterval = null;
        this._bgmTick = 0;
        this._bgmRunning = false;
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
        this.bgmGain.gain.value = 0.35;
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

    startBGM() {
        if (!this.ctx || this._bgmRunning) return;
        this._bgmRunning = true;
        this._bgmTick = 0;
        const stepMs = 250; // 8th note at 120 BPM

        const bass = [
            65.41, 65.41, 0, 0, 98.00, 98.00, 0, 0,
            110.00, 110.00, 0, 0, 87.31, 87.31, 0, 0,
        ];
        const melody = [
            261.63, 0, 329.63, 0, 392.00, 0, 0, 0,
            440.00, 0, 392.00, 0, 329.63, 0, 261.63, 0,
            0, 0, 329.63, 0, 392.00, 0, 0, 0,
            440.00, 0, 523.25, 0, 440.00, 0, 392.00, 0,
        ];

        this._bgmInterval = setInterval(() => {
            if (!this.ctx || this._muted) return;
            const t = this.ctx.currentTime;
            const bi = this._bgmTick % bass.length;
            const mi = this._bgmTick % melody.length;

            if (bass[bi]) this._noteOsc('square', bass[bi], 0.18, 0.18, t, this.bgmGain);
            if (melody[mi]) this._noteOsc('square', melody[mi], 0.1, 0.15, t, this.bgmGain);

            this._bgmTick++;
        }, stepMs);
    }

    stopBGM() {
        clearInterval(this._bgmInterval);
        this._bgmInterval = null;
        this._bgmRunning = false;
    }

    setMuted(muted) {
        this._muted = muted;
        if (this.master) {
            this.master.gain.value = muted ? 0 : 0.6;
        }
    }

    _noteOsc(type, freq, volume, duration, startTime, destination) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        g.gain.setValueAtTime(volume, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(g).connect(destination || this.sfxGain);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.01);
    }

    _sounds = {
        shoot() {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(900, t);
            osc.frequency.exponentialRampToValueAtTime(250, t + 0.07);
            g.gain.setValueAtTime(0.25, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            osc.connect(g).connect(this.sfxGain);
            osc.start(t); osc.stop(t + 0.09);
        },

        enemy_die() {
            const t = this.ctx.currentTime;
            const bufSize = Math.floor(this.ctx.sampleRate * 0.18);
            const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.8;
            const src = this.ctx.createBufferSource();
            src.buffer = buf;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.35, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
            src.connect(g).connect(this.sfxGain);
            src.start(t); src.stop(t + 0.2);
        },

        player_hit() {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
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
            this._noteOsc('square', 523.25, 0.2, 0.08, t, this.sfxGain);
            this._noteOsc('square', 659.25, 0.2, 0.08, t + 0.1, this.sfxGain);
        },

        enemy_shoot() {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.exponentialRampToValueAtTime(120, t + 0.1);
            g.gain.setValueAtTime(0.15, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc.connect(g).connect(this.sfxGain);
            osc.start(t); osc.stop(t + 0.11);
        },
    };
}
