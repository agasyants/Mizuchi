import Mix from "../data/mix";
import MixDrawer from "../drawers/mix_drawer";


export default class Mixer {
    private chunkLength: number = 0;
    private audioCtx: AudioContext | null = null;
    private mix: Mix;
    private mixDrawer: MixDrawer;
    private counter = 0;
    private totalLength = 0;
    private readonly chunk_buffer = 5;
    private start = 0;

    constructor(mix: Mix, mixDrawer: MixDrawer) {
        this.mix = mix;
        this.mixDrawer = mixDrawer;
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

    private async play(length: number = 128) {
        this.audioCtx = new AudioContext();
        this.mix.sampleRate = this.audioCtx.sampleRate;
        this.chunkLength = 1000;
        this.counter = 0;
        this.totalLength = 0; 
        this.start = Math.round(this.mix.start * 30 / this.mix.bpm * this.mix.sampleRate);
        this.mix.playback = this.start;
        this.totalLength = Math.round(length * 30 / this.mix.bpm * this.mix.sampleRate);
        for (let i = 0; i < this.chunk_buffer; i++)
            this.generateChunk();
    }

    private async stop() {
        if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
        }
    }

    private async generateChunk() {
        const chunk: Float32Array = new Float32Array(this.chunkLength);
        for (let i = 0; i < this.chunkLength; i++) {
            if (this.mix.playback > this.totalLength) {
                this.stop();
                return;
            }
            if (!this.audioCtx) return;
            this.mix.playback++;
            if (i % 10000 == 0)
                this.mixDrawer.render();
            chunk[i] = this.mix.outputNode.get();
        } 
        console.log("chunk");
        this.counter++;
        this.toBuffer(chunk);
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    private toBuffer(array: Float32Array) {
        if (!this.audioCtx) return;
        const buffer = this.audioCtx.createBuffer(1, this.chunkLength, this.audioCtx.sampleRate);
        buffer.copyToChannel(array, 0);
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioCtx.destination);
        source.start((this.mix.playback-this.chunkLength-this.start)/this.mix.sampleRate);
        source.addEventListener("ended", () => {
            this.counter -= 1;
            source.disconnect();
            if (this.counter == this.chunk_buffer-1)
                this.generateChunk();
        })
    }
}
