import Note from "../classes/note";
import OscFunction from "./osc_function";

export default class Oscillator {
    oscFunction:OscFunction;
    constructor(func:OscFunction = new OscFunction()) {
        this.oscFunction = func;
    }
    play(note:Note, sampleRate:number, i:number, SPS:number):number {
        let freq = note.getFrequency();
        let t = sampleRate/freq;
        return this.oscFunction.getSample((i-note.start*SPS)%t/t);
    }
}