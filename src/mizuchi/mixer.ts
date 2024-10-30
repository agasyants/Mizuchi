import Mix from "./mix";
import Note from "./note";

export class Mixer{
    chunks:Float32Array[] = [];
    chunksLength:number = 50000;
    audioCtx: AudioContext|null = null;
    sampleRate:number = 44100;
    constructor(public mix:Mix){ }
    play(start_time:number = 0, length:number = 20){
        this.audioCtx = new AudioContext();
        this.chunks = [];
        this.sampleRate = this.audioCtx.sampleRate;
        this.mixTracks((length-start_time)*this.sampleRate);
    }
    stop(){
        if (this.audioCtx) this.audioCtx.close();
        this.audioCtx = null;
    }
    playChunk(i:number){
        if (!this.audioCtx) return;
        if (i>=this.chunks.length){
            this.stop();
            return;
        }
        console.log(i);
        let audioBuffer =  this.audioCtx.createBuffer(1, this.chunksLength,  this.audioCtx.sampleRate);
        audioBuffer.copyToChannel(this.chunks[i], 0);
        let source =  this.audioCtx.createBufferSource();
        source.addEventListener("ended", ()=>{
            this.playChunk(i+1);
        });
        source.buffer = audioBuffer;
        source.connect(this.audioCtx.destination);
        source.start();
    }

    mixTracks(length:number):Float32Array{
        // let waves:Float32Array[] = [];
        let mixed:Float32Array = new Float32Array(length);
        let notes:Note[][] = [];
        for (let i = 0; i < this.mix.tracks.length; i++){
            // waves.push(new Float32Array(length));
            notes.push(this.mix.tracks[i].getFullScore());
            console.log(notes[i]);
        }
        for (let i = 0; i < length; i++){
            if (i%this.chunksLength==0 && i!=0){
                console.log("gen");
                this.chunks.push(mixed.slice(i-this.chunksLength, i));
                if (this.chunks.length==1){
                    this.playChunk(0);
                }
            } 
            let sum = 0;
            for (let j=0; j<this.mix.tracks.length; j++){
                let res = this.mix.tracks[j].inst.play(notes[j],this.mix.bpm,this.sampleRate, i);
                sum += res;
                // waves[j][i] = res;
            } 
            mixed[i] = sum/this.mix.tracks.length;
        }
        return mixed;
    }
}