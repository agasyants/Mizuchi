import Mix from "./mix";
import Note from "./note";


export class Mixer {
    chunksLength: number = 0;
    audioCtx: AudioContext | null = null;
    audioBuffer: AudioBuffer|null = null;
    sampleRate: number = 44100;

    constructor(public mix: Mix) {}

    async toggle(){
        if (this.audioCtx){
            this.stop();
        } else if (!this.audioCtx) {
            this.play();
        }
    }

    async play(start_time: number = 0, length: number = 60) {
        this.audioCtx = new AudioContext();
        this.sampleRate = this.audioCtx.sampleRate;
        this.chunksLength = this.sampleRate;

        this.generateAndPlayChunks((length - start_time) * this.sampleRate);
    }

    async stop() {
        if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
        }
    }

    async generateAndPlayChunks(totalLength: number) {
        const mixed = new Float32Array(totalLength);
        const notes: Note[][] = this.mix.tracks.map(track => track.getFullScore());
        for (let i = 0; i < totalLength; i++) {
            if (!this.audioCtx){
                return;
            }
            if (i % this.chunksLength === 0 && i !== 0 && this.audioCtx) {
                let buffer = this.audioCtx.createBuffer(1, this.chunksLength, this.audioCtx.sampleRate);
                buffer.copyToChannel(mixed.slice(i - this.chunksLength, i), 0);
                let source = this.audioCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(this.audioCtx.destination);
                console.log((i-this.chunksLength)/this.sampleRate);
                source.start((i-this.chunksLength)/this.sampleRate);
                await new Promise(resolve => setTimeout(resolve, 0));
            }
            let sum = 0;
            for (let j = 0; j < this.mix.tracks.length; j++) {
                sum += this.mix.tracks[j].inst.play(notes[j], this.mix.bpm, this.sampleRate, i);
            }
            mixed[i] = sum / this.mix.tracks.length;
        }
    }
}