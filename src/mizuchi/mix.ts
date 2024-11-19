import Score from "./score";
import Track from "./track";
import Instrument from "./instrument";
import Oscillator from "./oscillator";
import Note from "./note";
import OscFunction, {BasicPoint, HandlePoint} from "./osc_function";
import AudioEffect from "./audio_effects";

export default class Mix{
    tracks:Track[] = [];
    max_score:number = 4;
    bpm:number = 120;
    start:number = 0;
    constructor(){
        let data = localStorage.getItem('key');
        if (data){
            this.load(JSON.parse(data));
        } else {
            this.create(new Track('track '+ (this.tracks.length+1).toString()));
            this.create(new Track('track '+ (this.tracks.length+1).toString()));
        }
    }
    save(){
        localStorage.setItem('key',JSON.stringify(this));
    }
    load(data:any){
        console.log(data);
        this.bpm = data.bpm;
        this.max_score = data.max_score;
        for (let track of data.tracks){
            const newFunc = new OscFunction();
            let newBasics:BasicPoint[] = [];
            for (let i of track.inst.osc.oscFunction.basics) newBasics.push(new BasicPoint(i.x, i.y, i.x_move, i.y_move));
            newBasics[0].x_move = false;
            newBasics[newBasics.length-1].x_move = false;
            let newHandles:HandlePoint[] = [];
            for (let i of track.inst.osc.oscFunction.handles) newHandles.push(new HandlePoint(i.x, i.y, i.xl, i.yl));
            newFunc.set([newBasics,newHandles]);
            const newOsc = new Oscillator(newFunc);
            const newInst = new Instrument(newOsc);
            const newTrack = new Track(track.name, newInst);
            for (let score of track.scores){
                const newScore = new Score(score.start_time, score.duration);
                newScore.start_note = score.start_note;
                // newScore.loop_guration = score.loop_guration;
                for (let note of score.notes){
                    newScore.notes.push(new Note(note.pitch, note.start, note.duration));
                }
                newTrack.scores.push(newScore);
            }
            this.tracks.push(newTrack);
        }
    }
    create(track:any, index:number=-1){
        if (index==-1) {
            this.tracks.push(track);
        } else {
            this.tracks.splice(index, 0, track);
        }
    }
    delete(track:Track){
        let index = this.tracks.indexOf(track);
        if (index > -1) { 
            this.tracks.splice(index, 1);
        }
        return index;

    }
    addAudioEffect(effect:AudioEffect){
        for (let track of this.tracks){
            track.audioEffects.push(effect);
        }
    }
}