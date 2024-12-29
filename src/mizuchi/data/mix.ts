import Score from "./score";
import Track from "./track";
import Note from "../classes/note";
import Node, { OutputNode} from "../classes/node"; 
// import OscFunction, {BasicPoint, HandlePoint} from "./osc_function";
// import AudioEffect from "../classes/audio_effects";
import Selection, { ScoreSelection, TrackSelection } from "../classes/selection";

export default class Mix{
    tracks:Track[] = [];
    nodes:Node[]=[];
    outputNode:Node = new OutputNode(0,0);
    bpm:number = 120;
    start:number = 0;
    playback:number = 0;
    sampleRate:number = 44100;
    selected:{scores:ScoreSelection, tracks:TrackSelection} = {scores:new ScoreSelection(), tracks:new TrackSelection()};
    tracks_number_on_screen:number = 6;
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
        for (let track of data.tracks){
            // const newFunc = new OscFunction();
            // let newBasics:BasicPoint[] = [];
            // for (let i of track.inst.osc.oscFunction.basics) newBasics.push(new BasicPoint(i.x, i.y, i.x_move, i.y_move));
            // newBasics[0].x_move = false;
            // newBasics[newBasics.length-1].x_move = false;
            // let newHandles:HandlePoint[] = [];
            // for (let i of track.inst.osc.oscFunction.handles) newHandles.push(new HandlePoint(i.x, i.y, i.xl, i.yl));
            // newFunc.set(newBasics,newHandles);
            const newTrack = new Track(track.name);
            for (let score of track.scores){
                const newScore = new Score(score.absolute_start, score.duration, score.loop_duration, score.relative_start);
                newScore.lowest_note = score.lowest_note;
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
    move(sel:Selection, [start, dur, loop, y, rel]:number[], reverse:boolean){
        if (reverse){
            rel = -rel;
            start = -start;
            dur = -dur;
            loop = -loop;
            y = -y;             
        }
        if (sel instanceof TrackSelection){
            for (let track of sel.elements){
                const index = this.tracks.indexOf(track);
                if (index > -1) {
                    this.tracks.splice(index, 1);
                    this.tracks.splice(index+y, 0, track);
                }
            }
        } else if (sel instanceof ScoreSelection){
            sel.start += start;
            sel.end =  sel.end+start+dur;
            for (let i = 0; i < sel.elements.length; i++){
                const score = sel.elements[i];
                this.tracks[sel.track_index[i]].scores.splice(this.tracks[sel.track_index[i]].scores.indexOf(score), 1);
                score.absolute_start += start;
                score.duration += dur;
                score.loop_duration += loop;
                sel.track_index[i] += y;
                score.relative_start = (score.loop_duration + score.relative_start + rel) % score.loop_duration;
                this.tracks[sel.track_index[i]].scores.push(score);
                
            }
        }
    }
    select(input: Track[]|Score[], start:number, end:number) {
        if (input.every(item => item instanceof Track))
            this.selectTracks(input);
        else if (input.every(item => item instanceof Score))
            this.selectScores(input, start, end);
        else
            console.error('Invalid input: must be an array of Tracks or Scores.');
    }
    selectTracks(tracks:Track[]){
        if (tracks.length){
            for (let track of tracks){
                const index = this.selected.tracks.elements.indexOf(track);
                if (index > -1) {
                    this.selected.tracks.elements.splice(index, 1);
                    this.selected.tracks.index.splice(index, 1);
                } else {
                    this.selected.tracks.elements.push(track);
                    this.selected.tracks.index.push(this.tracks.indexOf(track));
                }
            }
        }
    }
    selectScores(scores:Score[], start:number, end:number){
        console.log(start,end);
        if (scores.length){
            for (let score of scores){
                const index = this.selected.scores.elements.indexOf(score);
                if (index > -1) {
                    this.selected.scores.elements.splice(index, 1);
                    this.selected.scores.track_index.splice(index, 1);
                } else {
                    this.selected.scores.elements.push(score);
                    // Find track index for the score
                    for(let i = 0; i < this.tracks.length; i++) {
                        if (this.tracks[i].scores.includes(score)) {
                            this.selected.scores.track_index.push(i);
                            break;
                        }
                    }
                }
            }
            // Find start and end
            // if (this.selected.scores.elements.length){
                this.selected.scores.start = Math.min(start,end)*8;
                this.selected.scores.end = (Math.max(start,end)+1)*8;
                for (let i = 0; i < this.selected.scores.elements.length; i++){
                    if (this.selected.scores.elements[i].absolute_start < this.selected.scores.start) this.selected.scores.start = this.selected.scores.elements[i].absolute_start;
                    if (this.selected.scores.elements[i].absolute_start + this.selected.scores.elements[i].duration > this.selected.scores.end) this.selected.scores.end = this.selected.scores.elements[i].absolute_start + this.selected.scores.elements[i].duration;
                }
            // } else {
            //     this.selected.scores.start = 0;
            //     this.selected.scores.end = 0;
            // }
        }
    }
}