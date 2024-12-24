import Mix from "../data/mix";
import MixDrawer from "../drawers/mix_drawer";


export default class Mixer {
    private chunkLength: number = 0;
    private audioCtx: AudioContext | null = null;
    private mix: Mix;
    private mixDrawer: MixDrawer;

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
        this.chunkLength = 20000;
        this.generateAndPlayChunks(Math.round(length * 30 / this.mix.bpm * this.mix.sampleRate));
    }

    private async stop() {
        if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
        }
    }

    private async generateAndPlayChunks(totalLength: number) {
        const k = Math.round(this.mix.start * 30 / this.mix.bpm * this.mix.sampleRate);
        const mixed: number[] = new Array();
        console.log(mixed);
    
        for (let i = k; i < totalLength; i++) {
            if (!this.audioCtx) return;
            this.mix.playback = i;
            if (i%10000==0)
                this.mixDrawer.render();
            // Генерация чанка каждые `chunkLength` отсчетов
            if ((i - k) % this.chunkLength === 0 && i !== k) {
                console.log("chunk");
                let chunk: Float32Array = new Float32Array(this.chunkLength);
    
                for (let c = 0; c < this.chunkLength; c++) {    
                    chunk[c] = mixed[c]; // Нормализация
                }
    
                this.toBuffer(chunk, i - k);
                await new Promise(resolve => setTimeout(resolve, 0));
    
                // Очищаем обработанные данные
                mixed.splice(0, this.chunkLength);
            }
            
            // Генерация данных для каждого трека
            mixed.push(this.mix.outputNode.get());
            
        }
    }
    

    private toBuffer(array: Float32Array, shift:number) {
        if (!this.audioCtx) return;
        let buffer = this.audioCtx.createBuffer(1, this.chunkLength, this.audioCtx.sampleRate);
        buffer.copyToChannel(array, 0);
        let source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioCtx.destination);
        source.start((shift-this.chunkLength)/this.mix.sampleRate);
    }
}
