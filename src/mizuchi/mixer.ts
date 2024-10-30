import Mix from "./mix";
import Note from "./note";

export class Mixer2{
    chunks:Float32Array[] = [];
    chunksLength:number = 40000;
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



export class Mixer {
    chunks: AudioBufferSourceNode[] = [];
    chunksLength: number = 40000;
    audioCtx: AudioContext | null = null;
    audioBuffer: AudioBuffer|null = null;
    sampleRate: number = 44100;
    isPlaying: boolean = false;

    constructor(public mix: Mix) {}

    start(){
        if (this.audioCtx && this.isPlaying){
            this.stop();
        } else {
            this.play();
        }
    }

    async play(start_time: number = 0, length: number = 60) {
        this.audioCtx = new AudioContext();
        this.chunks = [];
        this.sampleRate = this.audioCtx.sampleRate;
        this.isPlaying = true;

        // Start generating and playing chunks asynchronously
        this.generateAndPlayChunks((length - start_time) * this.sampleRate);
    }

    stop() {
        this.isPlaying = false;
        if (this.audioCtx) this.audioCtx.close();
        this.audioCtx = null;
    }

    async playChunk(i: number) {
        if (!this.audioCtx || i >= this.chunks.length || !this.isPlaying) {
            this.stop();
            return;
        }
        console.log(this.chunks.length);
        // Set up the next chunk to play when the current one ends
        this.chunks[i].addEventListener("ended", () => {
            this.chunks.shift();
            this.playChunk(i)
        });
        this.chunks[i].start();
    }

    async generateAndPlayChunks(totalLength: number) {
        const mixed = new Float32Array(totalLength);
        const notes: Note[][] = this.mix.tracks.map(track => track.getFullScore());

        for (let i = 0; i < totalLength; i++) {
            if (i % this.chunksLength === 0 && i !== 0 && this.audioCtx) {
                let buffer = this.audioCtx.createBuffer(1, this.chunksLength, this.audioCtx.sampleRate);
                buffer.copyToChannel(mixed.slice(i - this.chunksLength, i), 0);
                let source = this.audioCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(this.audioCtx.destination);
                this.chunks.push(source);

                if (this.chunks.length == 1) {
                    this.playChunk(0);
                }

                await new Promise(resolve => setTimeout(resolve, 0)); // Yield control to keep UI responsive
            }

            let sum = 0;
            for (let j = 0; j < this.mix.tracks.length; j++) {
                sum += this.mix.tracks[j].inst.play(notes[j], this.mix.bpm, this.sampleRate, i);
            }
            mixed[i] = sum / this.mix.tracks.length;
        }

        // if (mixed.length > 0) {
        //     this.chunks.push(mixed.slice(totalLength - this.chunksLength));
        // }
    }
}