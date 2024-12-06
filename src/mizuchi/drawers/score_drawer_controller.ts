import ScoreDrawer from "./score_drawer";
import Note from "../classes/note";
import Score from "../data/score";
import { Complex, Create, Delete, Move } from "../classes/CommandPattern";

export default class score_drawer_controller {
    private drawer: ScoreDrawer;
    private scrollInterval: any = null;
    constructor(drawer: ScoreDrawer) {
        this.drawer = drawer;
    }
    setScore(score:Score){
        this.drawer.score = score;
        this.drawer.canvas.style.display = 'block';
        this.drawer.canvas.focus();
        this.drawer.render();
    }
    scroll(i:number){
        this.drawer.score.start_note -= i;
        if (this.drawer.score.start_note < 0)
            this.drawer.score.start_note = 0;
        else if (this.drawer.score.start_note > this.drawer.max_note) 
            this.drawer.score.start_note = this.drawer.max_note;
        else if (this.drawer.drugged) {
            if (this.drawer.score.selection.selected.length) {
                this.drawer.score.selection.offset_pitch -= i;
                this.drawer.score.selection.drugged_y += i;
            } else {                
                this.drawer.sectorsSelection.y2 -= i;
                this.select()
            }
        }
        this.drawer.render();
    }
    copy(){
        this.drawer.buffer = this.drawer.score.selection.clone();
    }
    dublicate(){
        let paste = [];
        for (let note of this.drawer.score.selection.selected){
            paste.push(note.clone());
        }
        let s = this.drawer.score.selection;
        let commands = [new Move(this.drawer.score, s, [s.end-s.start,0,0]), new Create(this.drawer.score, paste)]
        this.drawer.commandPattern.addCommand(new Complex(commands))
    }
    paste(){
        let paste = [];
        for (let note of this.drawer.buffer.selected){
            paste.push(new Note(note.pitch, note.start + this.drawer.score.selection.start, note.duration))
        }
        this.drawer.commandPattern.addCommand(new Create(this.drawer.score, paste));
    }
    cut(){
        this.copy();
        this.delete();
    }
    delete(){
        this.drawer.commandPattern.addCommand(new Delete(this.drawer.score, this.drawer.score.selection.selected));
        this.drawer.score.selection.selected = [];
    }
    applyChanges(ctrl:boolean){
        let s = this.drawer.score.selection;
        if (ctrl){
            if (s.offset_start || s.offset_duration || s.offset_pitch) {
                let commands = [];
                let notes = s.cloneContent();
                commands.push(new Move(this.drawer.score, s, [s.offset_start, s.offset_duration, s.offset_pitch]));
                commands.push(new Create(this.drawer.score, notes));
                this.drawer.commandPattern.addCommand(new Complex(commands));
            } 
        } else {
            if (s.offset_start || s.offset_duration || s.offset_pitch) {
                this.drawer.commandPattern.addCommand(new Move(this.drawer.score, s, [s.offset_start, s.offset_duration, s.offset_pitch]));
            } 
        }
        this.drawer.update_mix();
        s.clear();
    }
    zoom(i:number){
        if (this.drawer.score.start_note >= this.drawer.max_note && this.drawer.score.start_note <= 0 && i==1) return;
        this.drawer.notes_width_count += i*2;
        if (this.drawer.score.start_note >= this.drawer.max_note){ 
            this.drawer.score.start_note -= i*2;
        } else if (this.drawer.score.start_note > 0) {
            this.drawer.score.start_note -= i
        }
        if (this.drawer.drugged){
            this.drawer.score.selection.offset_pitch += (this.drawer.sectorsSelection.y1-i);
            this.drawer.score.selection.offset_start += this.drawer.sectorsSelection.x1;
        }
        this.drawer.max_note = 127 - this.drawer.notes_width_count;
        this.drawer.note_h = this.drawer.height/this.drawer.notes_width_count;
        this.drawer.render();
    }
    selectAll(){
        this.drawer.score.selection.selected = [];
        for (let note of this.drawer.score.notes){
            this.drawer.score.selection.selected.push(note);
            this.drawer.score.selection.start = Math.min(this.drawer.score.selection.start, note.start);
            this.drawer.score.selection.end = Math.max(this.drawer.score.selection.end, note.start+note.duration);
        }
    }
    selectedToChosen(){
        if (this.drawer.hovered.note){
            this.drawer.score.selection.selected = [this.drawer.hovered.note]
        } else {
            this.drawer.score.selection.selected = this.drawer.hovered.notes;
        }
        this.drawer.hovered.notes = [];
        this.drawer.score.selection.start = this.drawer.sectorsSelection.x1;
        this.drawer.score.selection.end = this.drawer.sectorsSelection.x2+1;
        for (let note of this.drawer.score.selection.selected){
            this.drawer.score.selection.start = Math.min(this.drawer.score.selection.start, note.start);
            this.drawer.score.selection.end = Math.max(this.drawer.score.selection.end, note.start+note.duration);
        }
    }
    addSelectedToChosen(){
        let s = this.drawer.score.selection;
        s.start = Math.min(s.start, this.drawer.sectorsSelection.x1);
        s.end = Math.max(s.end, this.drawer.sectorsSelection.x2+1);
        let notes = this.drawer.hovered.notes;
        if (this.drawer.hovered.note){
            notes = notes.concat([this.drawer.hovered.note])
        }
        for (let note of notes){
            if (s.selected.includes(note)) {  
                s.selected.splice(s.selected.indexOf(note), 1);
                s.start = Math.min(s.start, note.start);
                s.end = Math.max(s.end, note.start+note.duration);
            } else {
                s.start = Math.min(s.start, note.start);
                s.end = Math.max(s.end, note.start+note.duration);
                s.selected.push(note);
            }
        }
        this.drawer.hovered.notes = [];
    }
    doubleInput(x:number, y:number){
        if (this.drawer.hovered.note) {
            this.delete();
        } else {
            [x,y] = this.processInput(x, y);
            [x,y] = this.getMatrix(x, y);
            this.drawer.commandPattern.addCommand(new Create(this.drawer.score, [new Note(y+this.drawer.score.start_note,x,1)]));
        }        
        this.drawer.hovered.notes = [];
        this.drawer.update_mix();
        this.drawer.render();
    }
    getMatrix(x:number,y:number){
        return [Math.floor(x*this.drawer.score.duration), Math.floor(y*this.drawer.notes_width_count)];
    }
    getGrid(x:number, y:number){
        return [x*this.drawer.score.duration, y*this.drawer.notes_width_count];
    }
    processInput(x:number, y:number){
        x = (x - this.drawer.margin_left/this.drawer.canvas.width) * this.drawer.canvas.width/this.drawer.width - this.drawer.pianoWidth;
        y = 1-(y-this.drawer.margin_top*2/this.drawer.canvas.width)*this.drawer.canvas.height/this.drawer.height;
        return [x,y];
    }
    round(x:number,shift:boolean){
        if (!shift)
            return Math.round(x);
        return x;
    }
    clearInterval(){
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
            this.scrollInterval = null;
        }
    }
    drug(x:number, y:number, shift:boolean, ctrl:boolean){
        [x, y] = this.getGrid(x, y);
        if (y<2){
            this.clearInterval();
            this.scrollInterval = setInterval(() => this.scroll(1), 100*Math.pow(y/2,2));
        } else if (y>=this.drawer.notes_width_count-2){
            this.clearInterval();
            this.scrollInterval = setInterval(() => this.scroll(-1), 100*Math.pow((y-this.drawer.notes_width_count)/2,2));
        } else {
            this.clearInterval();
        }
        y = Math.floor(y);
        if (!shift) {
            x = Math.round(x);
        }
        if (this.drawer.score.selection.selected.length && this.drawer.hovered.note){
            let s = this.drawer.score.selection;
            let str = this.drawer.hovered.note.start % 1;
            let dur = (this.drawer.hovered.note.start + this.drawer.hovered.note.duration) % 1;
            if (this.drawer.hovered.start && !ctrl) {
                s.offset_start = x - this.round(s.drugged_x, shift) - str;
                s.offset_duration = this.round(s.drugged_x, shift) - x + str;
            } else if (this.drawer.hovered.end && !ctrl) {
                s.offset_duration = this.round(x - s.drugged_x, shift) - dur;
            } else {
                s.offset_start = this.round(x - s.drugged_x+0.5,shift) - str;
                s.offset_pitch = y - s.drugged_y;
            }
            if (shift) {
                x = Math.round(x+0.5)
            }
            this.setSS1(x, y);
            this.setSS2(x, y);
        } else {
            this.setSS2(x, y);
            this.select();
        }
    }
    setSS1(x:number, y:number){
        this.drawer.sectorsSelection.x1 = x;
        this.drawer.sectorsSelection.y1 = y+this.drawer.score.start_note;
    }
    setSS2(x:number, y:number){
        this.drawer.sectorsSelection.x2 = x;
        this.drawer.sectorsSelection.y2 = y+this.drawer.score.start_note;
    }
    select(){
        this.drawer.hovered.notes = [];
        let x_min = Math.min(this.drawer.sectorsSelection.x1,this.drawer.sectorsSelection.x2); 
        let x_max = Math.max(this.drawer.sectorsSelection.x1, this.drawer.sectorsSelection.x2);
        let y_min = Math.min(this.drawer.sectorsSelection.y1,this.drawer.sectorsSelection.y2)-this.drawer.score.start_note;
        let y_max = Math.max(this.drawer.sectorsSelection.y1, this.drawer.sectorsSelection.y2)-this.drawer.score.start_note;
        for (let note of this.drawer.score.notes){
            if ((x_min <= note.start+note.duration-1 && note.start <= x_max) && (y_min<=note.pitch-this.drawer.score.start_note && y_max >= note.pitch-this.drawer.score.start_note)){
                this.drawer.hovered.notes.push(note);
            }
        }
    }
    findNote(x:number, y:number, range:number, ctrl:boolean, alt:boolean){
        [x,y] = this.processInput(x,y);;
        if (x<0) x=0;
        if (x>1) x=1;
        if (y<0) y=0;
        if (y>1) y=1;
        
        if (this.drawer.drugged){
            this.drug(x,y,alt,ctrl);
        } else {
            [x, y] = this.getGrid(x,y);
            y = Math.floor(y);
            for (let note of this.drawer.score.notes){
                this.drawer.hovered.start = false;
                this.drawer.hovered.end = false;
                this.drawer.hovered.note = null;
                if (y == note.pitch-this.drawer.score.start_note){
                    let s = note.start;
                    if ((x-s<=range && x-s>=0) || (s-x<=range && s-x>=0)){
                        this.drawer.hovered.start = true;
                        this.drawer.hovered.note = note;
                        return;
                    }
                    s = note.start+note.duration;
                    if ((x-s<=range && x-s>=0) || (s-x<=range && s-x>=0)){
                        this.drawer.hovered.end = true;
                        this.drawer.hovered.note = note;
                        return;
                    }
                    if (x >= note.start && x <= note.start+note.duration){
                        this.drawer.hovered.note = note;
                        return;
                    }
                }
            }
            x = Math.floor(x);
            this.setSS1(x, y);
            this.setSS2(x, y);
        }
    }
}