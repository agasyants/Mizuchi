import Score from "./score";
import Oscillator from "./oscillator";

export default class Instrument {
    osc:Oscillator;
    constructor(osc:Oscillator) {
        this.osc = osc;
    }
    play(score:Score, bpm:number, sampleRate:number):Float32Array {
        let k = sampleRate/bpm*120;
        let wave = new Float32Array(score.length*k);
        score.notes.forEach((note) => {
           
            for (let i = 0; i < note.duration*k*0.125; i++){
                let t = Math.round(note.start*k*0.125);
                wave[t + i] += this.osc.play(note,sampleRate,i);
            }
        });
        return wave;
    }
}
