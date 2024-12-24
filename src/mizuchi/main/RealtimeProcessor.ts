declare const AudioWorkletProcessor: any;
declare const registerProcessor: (name: string, processorCtor: any) => void;

class RealtimeProcessor extends AudioWorkletProcessor {
    private localBuffer: Float32Array; // Локальный буфер для аудиоданных
    private playbackPosition: number; // Текущая позиция воспроизведения
    private bufferSize: number; // Размер локального буфера

    constructor() {
        super();
        this.playbackPosition = 0;
        this.bufferSize = 2048; // Размер буфера
        this.localBuffer = new Float32Array(this.bufferSize).fill(0);

        // Обработка сообщений от главного потока
        this.port.onmessage = (event: MessageEvent) => {
            if (event.data.type === "updateBuffer") {
                this.updateLocalBuffer(event.data.buffer as Float32Array);
            }
        };
    }

    private updateLocalBuffer(newBuffer: Float32Array): void {
        // Перенос новых данных в локальный буфер
        const lengthToCopy = Math.min(newBuffer.length, this.localBuffer.length - this.playbackPosition);
        this.localBuffer.set(newBuffer.subarray(0, lengthToCopy), this.playbackPosition);
        this.playbackPosition = (this.playbackPosition + lengthToCopy) % this.localBuffer.length;
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        const output = outputs[0];

        for (let channel = 0; channel < output.length; channel++) {
            const outputChannel = output[channel];
            for (let i = 0; i < outputChannel.length; i++) {
                // Чтение данных из локального буфера
                outputChannel[i] = this.localBuffer[i % this.localBuffer.length];
            }
        }

        return true;
    }
}

registerProcessor("realtime-processor", RealtimeProcessor);
