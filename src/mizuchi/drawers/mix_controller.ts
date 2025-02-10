import Mix from "../data/mix";
import CommandPattern, { Command, Complex, Create, Delete, Move } from "../classes/CommandPattern";
import Score from "../data/score";
import ScoreDrawer from "./score_drawer";
import Track from "../data/track";
import MixDrawer from "./mix_drawer";
import { HoveredMix } from "../classes/hovered";
import SectorSelection from "../classes/SectorSelection";
import WindowController from "../classes/WindowController";

export default class MixController {
    mix:Mix;
    ctrl:boolean = false;
    drawer:MixDrawer;
    hovered:HoveredMix;
    commandPattern:CommandPattern;
    sectorsSelection:SectorSelection;
    score_window:WindowController;

    constructor (mix:Mix, commandPattern:CommandPattern, drawer:MixDrawer, hovered:HoveredMix, sectorsSelection:SectorSelection, score_window:WindowController){
        this.mix = mix;
        this.commandPattern = commandPattern;
        this.drawer = drawer;
        this.hovered = hovered;
        this.sectorsSelection = sectorsSelection;
        this.score_window = score_window;
    }
    applyChanges(){
        const ss = this.mix.selected.scores;
        if (ss.offset.start || ss.offset.pitch || ss.offset.duration || this.ctrl){
            this.commandPattern.recordOpen()
            const offset = ss.offset;
            if (this.ctrl && !offset.duration){
                this.commandPattern.addCommand(new Complex(this.createScores(ss.elements.slice(), ss.track_index.slice())));
            }
            if (ss.offset.pitch){
                const scores = []
                const indexes = []
                for (let i = 0; i < ss.elements.length; i++){
                    const score = ss.elements[i];
                    this.deleteScores([score], [ss.track_index[i]]);
                    const parent_index = ss.track_index[i] + offset.pitch;
                    const track = this.mix.tracks[parent_index]
                    const new_score = score.clone(track.scores.getNewId());
                    this.commandPattern.addCommand(new Create(track, new_score, track.scores.length));
                    scores.push(new_score)
                    indexes.push(parent_index)
                }
                ss.set(scores, indexes)
            }
            this.moveSelectedScores();
            this.commandPattern.recordClose()
            this.drawer.calcMinMax();
            ss.clear();
        }
    }
    moveSelectedScores(){
        const ss = this.mix.selected.scores;
        const start = ss.offset.start;
        const dur = ss.offset.duration;
        const loop = ss.offset.loop_duration;
        this.commandPattern.addCommand(new Move(this.mix, ss.elements.slice(), [start, dur, loop, ss.offset.rel]));
        ss.start += start;
        ss.end = ss.end + start + dur;
    }
    createTracks(){

    }
    createScores(scores:Score[], ti:number[]):Command[]{
        const commands = [];
        for (let i = 0; i < scores.length; i++){
            const track = this.mix.tracks[ti[i]];
            const score = scores[i].clone(track.scores.getNewId());
            const index = track.scores.length;
            commands.push(new Create(track, score, index));
        }
        return commands;
    }
    deleteTracks(Tracks:Track[], ti:number[]){
        console.log(Tracks, ti);
        for (let i = 0; i < Tracks.length; i++){
            const track = Tracks[i];
            const index = this.mix.tracks.indexOf(track);
            this.commandPattern.addCommand(new Delete(this.mix, track, index));
        }
    }
    deleteScores(scores:Score[], ti:number[]){
        for (let i = 0; i < scores.length; i++){
            const score = scores[i];
            const track = this.mix.tracks[ti[i]];
            const index = track.scores.indexOf(score);
            this.commandPattern.addCommand(new Delete(track, score, index));
        }
    }
    deleteSelected(){
        const tracks = this.mix.selected.tracks;
        const scores = this.mix.selected.scores;
        this.commandPattern.recordOpen();
        if (scores.elements.length) {  // delete elements scores
            const elements = scores.elements.slice();
            this.deleteScores(elements, scores.track_index)
            scores.clear();
            scores.elements = [];
            scores.track_index = [];
            this.drawer.calcMinMax();
        } 
        else if (tracks.elements.length) { // delete elements tracks
            tracks.index = [];
            this.deleteTracks(tracks.elements.slice(), tracks.index);
            tracks.elements = [];
            this.drawer.calcHeights();
        }
        this.commandPattern.recordClose();
        this.drawer.calcMaxes();
    }
    findTrackIndex(tracks:Track[]):number[]{
        const indexes = [];
        for (let track of tracks){
            indexes.push(this.mix.tracks.indexOf(track));
        }
        return indexes;
    }
    dublicate(){
        const s = this.mix.selected.scores;
        let commands:Command[] = [];
        commands = commands.concat(this.createScores(s.elements.slice(), s.track_index));
        commands.push(new Move(this.mix, s.elements.slice(), [s.end-s.start, 0, 0, 0, 0]));
        this.commandPattern.addCommand(new Complex(commands))
    }
    selectAll(shift:boolean){
        const scores = [];
        for (let track of this.mix.tracks){
            for (let score of track.scores){
                if (shift && this.mix.selected.scores.elements.includes(score)) continue;
                scores.push(score);
            }
        }
        this.mix.select(scores,this.sectorsSelection.x1,this.sectorsSelection.x2);
    }
    concatScores(){
        const s = this.mix.selected.scores;
        if (s.max - s.min === 0) {
            let dur = 0;
            const parent = this.mix.tracks[s.track_index[0]];
            const new_score = new Score(parent, parent.scores.getNewId(), s.start, s.end-s.start, s.end-s.start);
            let lowest_note = 0;
            for (let score of s.elements){
                lowest_note += score.lowest_note;
                new_score.addNotes(score.getNotes(dur));
                dur += score.duration;
            } 
            new_score.lowest_note = Math.floor(lowest_note/s.elements.length);
            this.commandPattern.recordOpen();
            this.commandPattern.addCommand(new Create(parent, new_score, parent.scores.length));
            this.deleteSelected();
            this.mix.select([new_score], this.sectorsSelection.x1, this.sectorsSelection.x2);
            this.commandPattern.recordClose();
        }
    }
    doubleInput(){
        if (!this.hovered.track) {
            // creating new track
            this.commandPattern.addCommand(new Create(this.mix, new Track('track', this.mix, this.mix.tracks.getNewId()), this.mix.tracks.length));
            this.drawer.calcMaxes();
            this.drawer.calcHeights();
            this.render();
        } else if (this.mix.selected.scores.elements.length) {
            // open score
            const drawer = this.score_window.drawer;
            if (drawer instanceof ScoreDrawer) {
                if (drawer.canvas.style.display=='block') {
                    this.score_window.close();
                } else {
                    drawer.controller.setScore(this.mix.selected.scores.getLast());
                    this.score_window.open();
                }
            }
        } else {
            // creating new score
            let new_score;
            const len = (this.mix.selected.scores.end-this.mix.selected.scores.start);
            if (len)
                new_score = new Score(this.hovered.track, this.hovered.track.scores.getNewId(), this.mix.start*2, len, len, 0);
            else 
                new_score = new Score(this.hovered.track, this.hovered.track.scores.getNewId(), this.mix.start*2);
            this.commandPattern.addCommand(new Create(this.hovered.track, new_score, this.hovered.track.scores.length));
            this.drawer.calcMaxes();
            this.drawer.calcMinMax();
            this.render();
        }
        if (this.drawer.hitScan()){
            this.render();
        }
    }
    render(){
        this.drawer.render();
    }
    private round(x:number, shift:boolean){
        if (!shift)
            return Math.round(x);
        return x;
    }
    drug(x:number, y:number, alt:boolean, shift:boolean){
        // if (y<2){
        //     this.clearInterval();
        //     this.scrollInterval = setInterval(() => this.scroll(1), 100*Math.pow(y/2,2));
        // } else if (y>=this.notes_width_count-2){
        //     this.clearInterval();
        //     this.scrollInterval = setInterval(() => this.scroll(-1), 100*Math.pow((y-this.notes_width_count)/2,2));
        // } else {
        //     this.clearInterval();
        // }
        // y = Math.floor(y);
        // if (!shift) {
        //     x = Math.round(x);
        // }
        if (this.mix.selected.scores.elements.length && this.hovered.scores.length && !shift){
            const s = this.mix.selected.scores;
            const str = this.hovered.scores[0].absolute_start % 1;
            const dur = (this.hovered.scores[0].absolute_start + this.hovered.scores[0].duration) % 1;

            if (this.hovered.start) {
                s.offset.start = (x - this.round(s.drugged_x, shift) - str) * this.drawer.len;
                s.offset.duration = (this.round(s.drugged_x, shift) - x + str) * this.drawer.len;
                if (this.ctrl && this.mix.selected.scores.elements.length == 1){
                    s.offset.loop_duration = this.hovered.scores[0].duration - this.hovered.scores[0].loop_duration + s.offset.duration;
                } else {
                    s.offset.loop_duration = 0;
                    s.offset.rel = s.offset.start % s.elements[0].loop_duration;
                }
            } else if (this.hovered.end) {
                s.offset.duration = (this.round(x - s.drugged_x, shift) - dur) * this.drawer.len;
                if (this.ctrl && this.mix.selected.scores.elements.length == 1){
                    s.offset.loop_duration = this.hovered.scores[0].duration - this.hovered.scores[0].loop_duration + s.offset.duration;
                } else {
                    s.offset.loop_duration = 0;
                }
            } else {
                s.offset.start = (x - s.drugged_x) * this.drawer.len;
                if (s.offset.start + s.start < 0) {
                    s.offset.start =- s.start;
                }
                s.offset.pitch = y - s.drugged_y;
            }
            if (alt) {
                x = Math.round(x+0.5)
            }
            // console.log(s.offset.start+s.start, s.offset.duration+s.elements[0].duration, s.elements[0].loop_duration+s.offset.loop_duration);
            this.sectorsSelection.setSS1(x, y);
            this.sectorsSelection.setSS2(x, y);
        } else if (this.mix.selected.tracks.elements.length && this.hovered.track) {
            console.log('bbb');
        }
        else {
            this.sectorsSelection.setSS2(x, y);
            this.select();
        }
    }
    select(){
        this.hovered.scores = [];
        this.hovered.pos = [];
        const ss = this.sectorsSelection;
        const x_min = Math.min(ss.x1, ss.x2) * this.drawer.len; 
        const x_max = Math.max(ss.x1, ss.x2) * this.drawer.len;
        const y_min = Math.min(ss.y1, ss.y2);
        const y_max = Math.max(ss.y1, ss.y2);
        for (let i = 0; i < this.mix.tracks.length; i++){
            for (let score of this.mix.tracks[i].scores){
                if ((x_min <= score.absolute_start+score.duration-1 && score.absolute_start <= x_max) && (y_min <= i && y_max >= i)){
                    this.hovered.scores.push(score);
                    this.hovered.pos.push(i)
                }
            }
        }
    }
}