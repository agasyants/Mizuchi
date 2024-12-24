import Mix from "../data/mix";
import MixDrawer from "../drawers/mix_drawer";

export default class MixerWorklet {
    private audioCtx: AudioContext | null;
    private workletNode: AudioWorkletNode | null;
    private bufferSize: number;
    private playbackBuffer: Float32Array;
    private mix: Mix;
    private intervalId: number | null;
    private mixDrawer: MixDrawer;

    constructor(mix:Mix, mixDrawer:MixDrawer) {
        this.audioCtx = null;
        this.workletNode = null;
        this.mix = mix;
        this.bufferSize = 1000; // Размер буфера
        this.playbackBuffer = new Float32Array(this.bufferSize).fill(0);
        this.intervalId = null;
        this.mixDrawer = mixDrawer;
    }

    async toggle(){
        if (this.audioCtx) {
            await this.stop();
        } else {
            await this.play();
        }
    }

    private async play(): Promise<void> {
        if (!this.audioCtx) {
            this.audioCtx = new AudioContext();
        }

        // Загружаем аудиоработник
        await this.audioCtx.audioWorklet.addModule("src/mizuchi/main/RealtimeProcessor.ts");

        // Создаём AudioWorkletNode
        this.workletNode = new AudioWorkletNode(this.audioCtx, "realtime-processor");

        // Начинаем генерацию данных
        this.generateAudioData();

        // Подключаем аудиоработник к выходу
        this.workletNode.connect(this.audioCtx.destination);
    }

    private async stop(): Promise<void> {
        if (!this.audioCtx || !this.workletNode) return;

        // Останавливаем и очищаем ресурсы
        this.audioCtx.close();
        this.workletNode.disconnect();

        this.audioCtx = null;
        this.workletNode = null;

        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private generateAudioData(): void {
        // Интервал генерации звука
        this.intervalId = setInterval(() => {
            for (let i = 0; i < this.bufferSize; i++) {
                this.playbackBuffer[i] = this.mix.outputNode.get();
                this.mix.playback++; // Увеличиваем playback
            }
            this.mixDrawer.render();

            // Отправляем буфер в аудиоработник
            this.workletNode!.port.postMessage({
                type: "updateBuffer",
                buffer: this.playbackBuffer,
            });
        }, (this.bufferSize / this.mix.sampleRate) * 1000);
    }
}
