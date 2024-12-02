import {Delay} from "../classes/audio_effects";
import Mix from "../data/mix";
import Note from "../classes/note";


export class Mixer {
    private chunkLength: number = 0;
    private audioCtx: AudioContext | null = null;
    private sampleRate: number = 44100;
    private mix: Mix;

    constructor(mix: Mix) {
        this.mix = mix;
    }

    async toggle(){
        if (this.audioCtx){
            console.log("stop");
            this.stop();
        } else if (!this.audioCtx) {
            console.log("play");
            this.play();
        }
    }

    private async play(length: number = 60) {
        this.audioCtx = new AudioContext();
        this.sampleRate = this.audioCtx.sampleRate;
        this.chunkLength = 20000;
        this.generateAndPlayChunks(Math.round((length - this.mix.start*30/this.mix.bpm) * this.sampleRate));
    }

    private async stop() {
        if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
        }
    }

    private async generateAndPlayChunks(totalLength: number) {
        let k = Math.round(this.mix.start*30/this.mix.bpm*this.sampleRate);
        let mixed = new Array;
        for (let i = 0; i < this.mix.tracks.length; i++) {
            let track = [new Array];
            for (let j = 0; j < this.mix.tracks[i].audioEffects.length; j++) {
                let effect = this.mix.tracks[i].audioEffects[j];
                if (effect instanceof Delay){
                    track.push(effect.getStart());
                }
                track.push(new Array);
            }
            mixed.push(track);
        }   

        console.log(mixed);
        const notes: Note[][] = this.mix.tracks.map(track => track.getFullScore());
        for (let i = k; i < totalLength; i++) {
            if (!this.audioCtx) return;
            if ((i-k)%this.chunkLength === 0 && i!==k) {
                console.log("chunk");
                let chunk: Float32Array = new Float32Array(this.chunkLength);
                for (let c = 0; c < this.chunkLength; c++) {
                    for (let t = 0; t < this.mix.tracks.length; t++) {
                        let sum = mixed[t][0][c];
                        for (let e = 0; e < this.mix.tracks[t].audioEffects.length; e++) {
                            let effect = this.mix.tracks[t].audioEffects[e];
                            sum = sum*(1-effect.dry) + mixed[t][e+1][c]*effect.dry;
                        }
                        chunk[c] += sum;
                    }
                    chunk[c] /= this.mix.tracks.length;
                }
                // console.log(mixed);
                for (let track of mixed){
                    for (let modul of track){
                        modul.splice(0, this.chunkLength);
                    }
                }
                // console.log(mixed);
                this.toBuffer(chunk, i-k);
                await new Promise(resolve => setTimeout(resolve, 0));
            }
            for (let t = 0; t < this.mix.tracks.length; t++) {
                mixed[t][0].push(this.mix.tracks[t].inst.play(notes[t], this.mix.bpm, this.sampleRate, i));
                for (let e = 0; e < this.mix.tracks[t].audioEffects.length; e++){
                    let effect = this.mix.tracks[t].audioEffects[e].process(mixed[t][e][mixed[t][0].length-1]);
                    for (let s=0; s<effect.length; s++){
                        mixed[t][e+1].push(effect[s]);
                        // if (mixed[t][0].length+s > mixed[t][e+1].length){
                        //     mixed[t][e+1].push(effect[s]);
                        // } else { 
                        //     mixed[t][e+1][mixed[t][0].length-1+s] += effect[s];
                        // }
                    }
                }
            }
        }
    }

    private toBuffer(array: Float32Array, shift:number) {
        if (!this.audioCtx) return;
        let buffer = this.audioCtx.createBuffer(1, this.chunkLength, this.audioCtx.sampleRate);
        buffer.copyToChannel(array, 0);
        let source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioCtx.destination);
        source.start((shift-this.chunkLength)/this.sampleRate);
    }
}
