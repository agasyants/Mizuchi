import Instrument from "./instrument";
import Score from "./score";

export default class Track {
    inst:Instrument;
    name:string;
    wave:number[] = [];
    // audioEffects:Effect[] = [];
    scores:Score[] = [];
    // scoreEffects:ScoreEffect[] = [];
    constructor(name:string, inst:Instrument = new Instrument()) { 
        this.name = name;
        this.inst = inst;
    }
    generate(bpm:number, sampleRate:number) {
        this.wave = [];
        let full = new Score(0);
        for (let score of this.scores) {
            full.addScore(score);
        }
        let aa = this.inst.play(full, bpm, sampleRate);
        for (let i = 0; i < aa.length; i++) {
            this.wave.push(aa[i]);
        }
    }
}
