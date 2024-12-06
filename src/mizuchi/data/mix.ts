import Score from "./score";
import Track from "./track";
import Instrument from "./instrument";
import Oscillator from "./oscillator";
import Note from "../classes/note";
import { sc, tr } from "../drawers/mix_drawer";
import OscFunction, {BasicPoint, HandlePoint} from "./osc_function";
import AudioEffect from "../classes/audio_effects";

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
    create(sel:any){
        if (sel instanceof tr){
            this.tracks.splice(sel.index, 0, sel.track);
        } else if (sel instanceof sc){
            this.tracks[sel.index].scores.push(sel.score);
        }
    }
    delete(sel:any){
        if (sel instanceof tr){
            this.tracks.splice(sel.index, 1);
        } else if (sel instanceof sc){
            let index = this.tracks[sel.index].scores.indexOf(sel.score);
            if (index > -1) {
                this.tracks[sel.index].scores.splice(index, 1);
            }
        }
    }
    move(sel:any, offset:number[], reverse:boolean){
        if (sel[0] instanceof tr){
            for (let track of sel){
                let index = this.tracks.indexOf(track.track);
                if (index > -1) {
                    this.tracks.splice(index, 1);
                    this.tracks.splice(index+offset[2], 0, track.track);
                }
            }
        } else if (sel[0] instanceof sc){
            for (let sc of sel){
                const index = this.tracks[sc.index].scores.indexOf(sc.score);
                if (index > -1) {
                    this.tracks[sc.index].scores.splice(index, 1);
                    if (reverse){
                        sc.score.start_time -= offset[0];
                        sc.score.duration -= offset[1];
                        sc.index -= offset[2];                        
                    } else {
                        sc.score.start_time += offset[0];
                        sc.score.duration += offset[1];
                        sc.index += offset[2];
                    }
                    console.log(sc,this.tracks);
                    this.tracks[sc.index].scores.push(sc.score);
                }
            }
        }
    }
    addAudioEffect(effect:AudioEffect){
        for (let track of this.tracks){
            track.audioEffects.push(effect);
        }
    }
}