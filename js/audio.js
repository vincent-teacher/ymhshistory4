/**
 * 楊梅高中校史大事記 - Web Audio API 原生音效合成引擎
 * 完全免外部音訊檔案，高保真合成清脆自然音效
 */

class SoundEffects {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        if (!this.initialized) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
                this.initialized = true;
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setEnabled(val) {
        this.enabled = Boolean(val);
    }

    // 基礎合成器：正弦波加柔和衰減包絡
    _playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.15) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // 1. 按鈕點擊音：清脆水滴音
    playClick() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.06);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    // 2. 標籤切換音：雙音階輕滑
    playTab() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        this._playTone(523.25, 'sine', 0.08, 0.1); // C5
        setTimeout(() => {
            this._playTone(659.25, 'sine', 0.1, 0.1); // E5
        }, 50);
    }

    // 3. 搜尋/篩選成功音：清亮和弦三音階
    playSearch() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const notes = [587.33, 739.99, 880]; // D5, F#5, A5
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this._playTone(freq, 'triangle', 0.14, 0.08);
            }, idx * 45);
        });
    }

    // 4. 展開歷史記憶散文：柔和書頁翻閱音效
    playExpand() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(250, now + 0.1);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
    }

    // 5. 設定變更/開關反饋音
    playToggle(on = true) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        if (on) {
            this._playTone(440, 'sine', 0.06, 0.1);
            setTimeout(() => this._playTone(880, 'sine', 0.09, 0.12), 60);
        } else {
            this._playTone(880, 'sine', 0.06, 0.12);
            setTimeout(() => this._playTone(440, 'sine', 0.09, 0.1), 60);
        }
    }
}

window.soundEngine = new SoundEffects();
