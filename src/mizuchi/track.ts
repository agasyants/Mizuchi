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
        this.normalize();
    }
    clip(){
        for (let i of this.wave){
            if (i > 1) i = 1;
            if (i < -1) i = -1;
        }
    }
    normalize(){
        let max = 1;
        for (let i of this.wave){
            if (Math.abs(i) > max) max = Math.abs(i);
        }
        for (let i = 0; i < this.wave.length; i++){
            this.wave[i] /= max;
        }
    }
}
