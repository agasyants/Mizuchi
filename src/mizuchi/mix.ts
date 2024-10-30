import Score from "./score";
import Track from "./track";
import Instrument from "./instrument";
import Oscillator from "./oscillator";
import Note from "./note";
import OscFunction, {BasicPoint, HandlePoint} from "./osc_function";

export default class Mix{
    tracks:Track[] = [];
    max_score:number = 4;
    constructor(public bpm:number){
        let data = localStorage.getItem('key');
        if (data){
            this.load(JSON.parse(data));
        } else {
            this.addTrack();
            this.addTrack();
            this.addTrack(); 
        }
    }
    save(){
        localStorage.setItem('key',JSON.stringify(this));
    }
    load(data:any){
        console.log(data);
        for (let track of data.tracks){
            const newFunc = new OscFunction();
            let newBasics:BasicPoint[] = [];
            for (let i of track.inst.osc.oscFunction.basics) newBasics.push(new BasicPoint(i.x, i.y, i.x_move, i.y_move));
            newFunc.basics = newBasics;
            let newHandles:HandlePoint[] = [];
            for (let i of track.inst.osc.oscFunction.handles) newHandles.push(new HandlePoint(i.x, i.y, i.xl, i.yl));
            newFunc.handles = newHandles;
            const newOsc = new Oscillator(newFunc);
            const newInst = new Instrument(newOsc);
            const newTrack = new Track(track.name, newInst);
            for (let score of track.scores){
                const newScore = new Score(score.start_time, score.duration);
                for (let note of score.notes){
                    newScore.notes.push(new Note(note.pitch, note.start, note.duration));
                }
                newTrack.scores.push(newScore);
            }
            this.tracks.push(newTrack);
        }
    }
    addScore(track:Track){
        if (track.scores.length+1 > this.max_score){
            this.max_score = track.scores.length+1;
        }
        track.addScore();
    }
    addTrack(){
        this.tracks.push(new Track('track '+ (this.tracks.length+1).toString()));
        for (let i = 0; i < this.max_score; i++){
            this.tracks[this.tracks.length-1].addScore();
        }
    }
    removeTrack(track:Track){
        let index = this.tracks.indexOf(track);
        if (index > -1) this.tracks.splice(index, 1);
    }
}