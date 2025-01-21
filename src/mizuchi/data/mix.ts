import Score from "./score";
import Track from "./track";
// import Note from "../classes/note";
import { NodeSpace } from "../classes/node";
import { ScoreSelection, TrackSelection } from "../classes/selection";
import { IdArray } from "../classes/id_component";

export default class Mix {
    tracks = new IdArray<Track>();
    nodeSpace:NodeSpace = new NodeSpace(0,0,0,this);

    bpm: number = 120;
    start:   number = 0;
    loop_start:number = 0;
    loop_end:  number = 128;
    playback:    number = 0;
    sampleRate:number = 44100;
    loopped:  boolean = true;

    selected:{scores:ScoreSelection, tracks:TrackSelection} = {scores:new ScoreSelection(), tracks:new TrackSelection()};
    tracks_number_on_screen:number = 6;
    
    constructor(){
        let data = localStorage.getItem('key');
        if (data){
            this.load(JSON.parse(data));
        } else {
            this.create(new Track('track '+ (this.tracks.length+1).toString(), this, 0));
            this.create(new Track('track '+ (this.tracks.length+1).toString(), this, 1));
            this.tracks.increment = 2;
        }
    }
    getFullId(){
        return "";
    }
    toJSON() {
        return {
            bpm: this.bpm,
            start: this.start,
            loo_start: this.loop_start,
            loop_end: this.loop_end,
            playback: this.playback,
            loopped: this.loopped,
            tracks_number_on_screen: this.tracks_number_on_screen,
            nodeSpace: this.nodeSpace,
            tracks: this.tracks,
        }
    }
    save() {
        const seen = new Set();

        const replacer = (key: string, value: unknown) => {
            // Пропускаем циклические ссылки
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    console.log("ERRRROORR",key, value);
                    return undefined; // Пропускаем цикл
                }
                seen.add(value);
            }
            return value;
        };
        console.log(JSON.stringify(this, replacer));
        // localStorage.setItem('key', JSON.stringify(this, replacer));
    }
    load(data:any){
        console.log(data);
        // this.bpm = data.bpm;
        // for (let track of data.tracks){
        //     // const newFunc = new OscFunction();
        //     // let newBasics:BasicPoint[] = [];
        //     // for (let i of track.inst.osc.oscFunction.basics) newBasics.push(new BasicPoint(i.x, i.y, i.x_move, i.y_move));
        //     // newBasics[0].x_move = false;
        //     // newBasics[newBasics.length-1].x_move = false;
        //     // let newHandles:HandlePoint[] = [];
        //     // for (let i of track.inst.osc.oscFunction.handles) newHandles.push(new HandlePoint(i.x, i.y, i.xl, i.yl));
        //     // newFunc.set(newBasics,newHandles);
        //     const newTrack = new Track(track.name, this, track.id);
        //     for (let score of track.scores){
        //         const newScore = new Score(score.absolute_start, score.id, score.duration, score.loop_duration, score.relative_start);
        //         newScore.lowest_note = score.lowest_note;
        //         for (let note of score.notes){
        //             newScore.notes.push(new Note(note.pitch, note.start, note.duration));
        //         }
        //         newTrack.scores.push(newScore);
        //     }
        //     this.tracks.push(newTrack);
        // }
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
                    'd'
                    track.scores.splice(index, 1);
                    return this.tracks.indexOf(track);
                }
            }
        }
    }
    move(sel:Track[]|Score[], [start, dur, loop, rel]:number[], reverse:boolean){
        if (reverse){
            rel = -rel;
            start = -start;
            dur = -dur;
            loop = -loop;
        }
        if (sel.every(item => item instanceof Track)){
            for (let track of sel){
                const index = this.tracks.indexOf(track);
                if (index > -1) {
                    this.tracks.splice(index, 1);
                    this.tracks.splice(index, 0, track);
                }
            }
        } else if (sel.every(item => item instanceof Score)){
            for (let i = 0; i < sel.length; i++){
                const score = sel[i];
                score.absolute_start += start;
                score.duration += dur;
                score.loop_duration += loop;
                score.relative_start = (score.loop_duration + (score.relative_start + rel) % score.loop_duration) % score.loop_duration;
            }
        }
    }
    select(input: Track[]|Score[], start:number, end:number) {
        if (input.length == 0)
            this.selectScores([],start,end);
        else if (input.every(item => item instanceof Track))
            this.selectTracks(input);
        else if (input.every(item => item instanceof Score))
            this.selectScores(input, start, end);
        else
            console.error('Invalid input: must be an array of Tracks or Scores.');
    }
    selectTracks(tracks:Track[]){
        // console.log("tracks");        
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
        // console.log("scores");       
        // console.log(start,end);
        for (let score of scores) {
            const index = this.selected.scores.elements.indexOf(score);
            if (index > -1) {
                this.selected.scores.elements.splice(index, 1);
                this.selected.scores.track_index.splice(index, 1);
            } else {
                this.selected.scores.elements.push(score);
                // Find track index for the score
                for (let i = 0; i < this.tracks.length; i++) {
                    if (this.tracks[i].scores.includes(score)) {
                        this.selected.scores.track_index.push(i);
                        break;
                    }
                }
            }
        }
        // Find start and end
        const s = this.selected.scores;
        s.start = Math.min(start,end)*8;
        s.end = (Math.max(start,end))*8;
        for (let i = 0; i < s.elements.length; i++){
            if (s.elements[i].absolute_start < s.start) s.start = s.elements[i].absolute_start;
            if (s.elements[i].absolute_start + s.elements[i].duration > s.end) s.end = s.elements[i].absolute_start + s.elements[i].duration;
        }
    }
}