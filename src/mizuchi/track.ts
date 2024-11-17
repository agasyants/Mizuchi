import Instrument from "./instrument";
import Score from "./score";
import Note from "./note";
import AudioEffect from "./audio_effects";

export default class Track {
    inst:Instrument;
    name:string;
    audioEffects:AudioEffect[] = [];
    scores:Score[] = [];
    // scoreEffects:ScoreEffect[] = [];
    constructor(name:string, inst:Instrument = new Instrument()) { 
        this.name = name;
        this.inst = inst;
    }
    addScore(){
        if (this.scores.length > 0){
            const last_score = this.scores[this.scores.length-1]
            this.scores.push(new Score(last_score.duration+last_score.start_time));
        } else {
            this.scores.push(new Score(0));
        }
    }
    deleteScore(score:Score){
        this.scores = this.scores.filter((s)=>s!=score);
    }
    getFullScore():Note[] {
        let full_score:Note[] = [];
        for (let score of this.scores){
            for (let note of score.notes){
                if (note.start<score.duration) {
                    full_score.push(new Note(note.pitch, note.start+score.start_time, note.duration));
                }
            }
        } 
        return full_score;
    }
}
