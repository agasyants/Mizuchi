import Note from "./note";
import OscFunction from "./osc_function";

export default class Oscillator {
    oscFunction:OscFunction;
    constructor(func:OscFunction) {
        this.oscFunction = func;
    }
    play(note:Note, sampleRate:number, i:number):number {
        let freq = note.getFrequency();
        let t = sampleRate/freq;
        return this.oscFunction.getI(i%t/t);
    }
}