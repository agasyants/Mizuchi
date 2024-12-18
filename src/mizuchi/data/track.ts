import Instrument from "./instrument";
import Score from "./score";
import Note from "../classes/note";
import AudioEffect from "../classes/audio_effects";

export default class Track {
    inst:Instrument;
    name:string;
    audioEffects:AudioEffect[] = [];
    scores:Score[] = [];
    renderHeight:number = 1;
    // scoreEffects:ScoreEffect[] = [];
    constructor(name:string, inst:Instrument = new Instrument()) { 
        this.name = name;
        this.inst = inst;
    }
    addScore(score:Score){
        this.scores.push(score);
    }
    delete(score:Score){
        this.scores = this.scores.filter((s)=>s!=score);
    }
    getFullScore():Note[] {
        let full_score:Note[] = [];
        for (let score of this.scores){
            full_score = full_score.concat(score.getNotes(score.start_time));
        } 
        return full_score;
    }
}
