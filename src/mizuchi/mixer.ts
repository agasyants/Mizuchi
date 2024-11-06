// import AudioEffect from "./audio_effects";
import Mix from "./mix";
import Note from "./note";


export class Mixer {
    chunkLength: number = 0;
    audioCtx: AudioContext | null = null;
    audioBuffer: AudioBuffer|null = null;
    sampleRate: number = 44100;
    start:number = 0;

    constructor(public mix: Mix) {}

    async toggle(){
        if (this.audioCtx){
            console.log("stop");
            this.stop();
        } else if (!this.audioCtx) {
            console.log("play");
            this.play();
        }
    }

    async play(length: number = 30) {
        this.audioCtx = new AudioContext();
        this.sampleRate = this.audioCtx.sampleRate;
        this.chunkLength = 10000;
        this.generateAndPlayChunks(Math.round((length - this.start*30/this.mix.bpm) * this.sampleRate));
    }

    async stop() {
        if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
        }
    }

    async generateAndPlayChunks(totalLength: number) {
        let k = Math.round(this.start*30/this.mix.bpm*this.sampleRate);
        let mixed: Float32Array[] = [];
        for (let i = 0; i < this.mix.tracks.length; i++) {
            mixed.push(new Float32Array(totalLength));
        }   
        const notes: Note[][] = this.mix.tracks.map(track => track.getFullScore());
        for (let i = k; i < totalLength; i++) {
            if (!this.audioCtx) return;
            if ((i-k) % this.chunkLength === 0 && i !== k) {
                let chunk: Float32Array = new Float32Array(this.chunkLength);
                for (let k = 0; k < this.chunkLength; k++) {
                    for (let j = 0; j < this.mix.tracks.length; j++) {
                        chunk[k] += mixed[j][i - this.chunkLength + k];
                    }
                    chunk[k] /= this.mix.tracks.length;
                }
                this.toBuffer(chunk, i, k);
                await new Promise(resolve => setTimeout(resolve, 0));
            }
            for (let j = 0; j < this.mix.tracks.length; j++) {
                mixed[j][i] = this.mix.tracks[j].inst.play(notes[j], this.mix.bpm, this.sampleRate, i); 
                for (let effect of this.mix.tracks[j].audioEffects){
                    let result = effect.process(mixed[j][i]);
                    for (let k=0; k<result.length; k++){
                        mixed[j][i+k] = result[k];
                    }
                }
            }
        }
    }

    toBuffer(array: Float32Array, i:number, k:number) {
        if (!this.audioCtx) return;
        let buffer = this.audioCtx.createBuffer(1, this.chunkLength, this.audioCtx.sampleRate);
        buffer.copyToChannel(array, 0);
        let source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioCtx.destination);
        source.start((i-this.chunkLength-k)/this.sampleRate);
    }
}
