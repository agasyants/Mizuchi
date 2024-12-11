import Score from "./score";
import Track from "./track";
import Instrument from "./instrument";
import Oscillator from "./oscillator";
import Note from "../classes/note";
import OscFunction, {BasicPoint, HandlePoint} from "./osc_function";
import AudioEffect from "../classes/audio_effects";
import Selection, { ScoreSelection, TrackSelection } from "../classes/selection";

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
                // newScore.loop_duration = score.loop_duration;
                for (let note of score.notes){
                    newScore.notes.push(new Note(note.pitch, note.start, note.duration));
                }
                newTrack.scores.push(newScore);
            }
            this.tracks.push(newTrack);
        }
    }
    create(sel:Track|Score, pos:number=-1){
        if (sel instanceof Track){
            if (pos==-1) pos = this.tracks.length;
            this.tracks.splice(pos, 0, sel);
        } else if (sel instanceof Score){
            this.tracks[pos].scores.push(sel);
        }
    }
    delete(sel:Track|Score){
        if (sel instanceof Track){
            const index = this.tracks.indexOf(sel);
            this.tracks.splice(this.tracks.indexOf(sel), 1);
            return index;
        } else if (sel instanceof Score){
            for (let track of this.tracks){
                const index = track.scores.indexOf(sel);
                if (index > -1) {
                    track.scores.splice(index, 1);
                    return this.tracks.indexOf(track);
                }
            }
        }
    }
    move(sel:Selection, offset:number[], reverse:boolean){
        let start;
        let dur;
        let y;
        if (reverse){
            start = -offset[0];
            dur = -offset[1];
            y = -offset[2];                        
        } else {
            start = offset[0];
            dur = offset[1];
            y = offset[2];
        }
        if (sel instanceof TrackSelection){
            for (let track of sel.elements){
                let index = this.tracks.indexOf(track);
                if (index > -1) {
                    this.tracks.splice(index, 1);
                    this.tracks.splice(index+offset[2], 0, track);
                }
            }
        } else if (sel instanceof ScoreSelection){
            sel.start += start;
            sel.end += start;
            for (let i = 0; i < sel.elements.length; i++){
                console.log(i,sel.elements.length);
                
                const score = sel.elements[i];
                this.tracks[sel.track_index[i]].scores.splice(this.tracks[sel.track_index[i]].scores.indexOf(score), 1);
                score.start_time += start;
                score.duration += dur;
                sel.track_index[i] += y;
                this.tracks[sel.track_index[i]].scores.push(score);
            }
        }
    }
    addAudioEffect(effect:AudioEffect){
        for (let track of this.tracks){
            track.audioEffects.push(effect);
        }
    }
}