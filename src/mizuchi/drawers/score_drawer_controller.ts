import ScoreDrawer from "./score_drawer";
import Note from "../classes/note";
import Score from "../data/score";
import { Complex, Create, Delete, Move } from "../classes/CommandPattern";

export default class score_drawer_controller {
    private drawer: ScoreDrawer;
    max_note: number;
    private scrollInterval: any = null;
    constructor(drawer:ScoreDrawer){
        this.drawer = drawer;
        this.max_note = 127 - this.drawer.notes_width_count;
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
        else if (this.drawer.score.start_note > this.max_note) 
            this.drawer.score.start_note = this.max_note;
        else if (this.drawer.drugged) {
            if (this.drawer.score.selection.elements.length) {
                this.drawer.score.selection.offset.pitch -= i;
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
        for (let note of this.drawer.score.selection.elements){
            paste.push(note.clone());
        }
        let s = this.drawer.score.selection;
        let commands = [new Move(this.drawer.score, s, [s.end-s.start,0,0]), new Create(this.drawer.score, paste)]
        this.drawer.commandPattern.addCommand(new Complex(commands))
    }
    paste(){
        let paste = [];
        for (let note of this.drawer.buffer.elements){
            paste.push(new Note(note.pitch, note.start + this.drawer.score.selection.start, note.duration))
        }
        this.drawer.commandPattern.addCommand(new Create(this.drawer.score, paste));
    }
    cut(){
        this.copy();
        this.delete();
    }
    delete(){
        this.drawer.commandPattern.addCommand(new Delete(this.drawer.score, this.drawer.score.selection.elements));
        this.drawer.score.selection.elements = [];
    }
    applyChanges(ctrl:boolean){
        const s = this.drawer.score.selection;
        if (ctrl){
            if (s.isShifted()) {
                const commands = [];
                const notes = s.cloneContent();
                commands.push(new Move(this.drawer.score, s, [s.offset.start, s.offset.duration, s.offset.pitch]));
                commands.push(new Create(this.drawer.score, notes));
                this.drawer.commandPattern.addCommand(new Complex(commands));
            } 
        } else {
            if (s.offset.start || s.offset.duration || s.offset.pitch) {
                this.drawer.commandPattern.addCommand(new Move(this.drawer.score, s, [s.offset.start, s.offset.duration, s.offset.pitch]));
            } 
        }
        this.drawer.update_mix();
        s.clear();
    }
    zoom(i:number){
        if (this.drawer.score.start_note >= this.max_note && this.drawer.score.start_note <= 0 && i==1) return;
        this.drawer.notes_width_count += i*2;
        if (this.drawer.score.start_note >= this.max_note){ 
            this.drawer.score.start_note -= i*2;
        } else if (this.drawer.score.start_note > 0) {
            this.drawer.score.start_note -= i
        }
        if (this.drawer.drugged){
            this.drawer.score.selection.offset.pitch += (this.drawer.sectorsSelection.y1-i);
            this.drawer.score.selection.offset.start += this.drawer.sectorsSelection.x1;
        }
        this.max_note = 127 - this.drawer.notes_width_count;
        this.drawer.note_h = this.drawer.height/this.drawer.notes_width_count;
        this.drawer.render();
    }
    selectAll(){
        this.drawer.score.selection.elements = [];
        for (let note of this.drawer.score.notes){
            this.drawer.score.selection.elements.push(note);
            this.drawer.score.selection.start = Math.min(this.drawer.score.selection.start, note.start);
            this.drawer.score.selection.end = Math.max(this.drawer.score.selection.end, note.start+note.duration);
        }
    }
    doubleInput(x:number, y:number){
        if (this.drawer.hovered.elements.length) {
            this.delete();
        } else {
            [x,y] = this.processInput(x, y);
            if (x<0) return;
            if (x>1) x=0.99;
            if (y<0) y=0;
            if (y>1) y=0.99;
            [x,y] = this.getMatrix(x, y);
            this.drawer.commandPattern.addCommand(new Create(this.drawer.score, [new Note(y+this.drawer.score.start_note,x,1)]));
        }        
        this.drawer.hovered.elements = [];
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
    private round(x:number,shift:boolean){
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
    private drug(x:number, y:number, shift:boolean, ctrl:boolean){
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
        if (this.drawer.score.selection.elements.length && this.drawer.score.selection.elements.includes(this.drawer.hovered.elements[0])){
            let s = this.drawer.score.selection;
            let str = this.drawer.hovered.elements[0].start % 1;
            let dur = (this.drawer.hovered.elements[0].start + this.drawer.hovered.elements[0].duration) % 1;
            if (this.drawer.hovered.start && !ctrl) {
                s.offset.start = this.round(x - s.drugged_x, shift) - str;
                s.offset.duration = this.round(s.drugged_x - x, shift) + str;
            } else if (this.drawer.hovered.end && !ctrl) {
                s.offset.duration = this.round(x - s.drugged_x, shift) - dur;
            } else {
                s.offset.start = this.round(x - s.drugged_x,shift) - str;
                s.offset.pitch = y - s.drugged_y;
            }
            if (!shift) {
                x = Math.floor(x)
            }
            this.setSS1(x, y);
            this.setSS2(x, y);
        } else {
            this.setSS2(Math.floor(x), y);
            this.select();
        }
    }
    private setSS1(x:number, y:number){
        this.drawer.sectorsSelection.x1 = x;
        this.drawer.sectorsSelection.y1 = y+this.drawer.score.start_note;
    }
    private setSS2(x:number, y:number){
        this.drawer.sectorsSelection.x2 = x;
        this.drawer.sectorsSelection.y2 = y+this.drawer.score.start_note;
    }
    private select(){
        this.drawer.hovered.elements = [];
        let x_min = Math.min(this.drawer.sectorsSelection.x1,this.drawer.sectorsSelection.x2); 
        let x_max = Math.max(this.drawer.sectorsSelection.x1, this.drawer.sectorsSelection.x2);
        let y_min = Math.min(this.drawer.sectorsSelection.y1,this.drawer.sectorsSelection.y2)-this.drawer.score.start_note;
        let y_max = Math.max(this.drawer.sectorsSelection.y1, this.drawer.sectorsSelection.y2)-this.drawer.score.start_note;
        for (let note of this.drawer.score.notes){
            if ((x_min <= note.start+note.duration-1 && note.start <= x_max) && (y_min<=note.pitch-this.drawer.score.start_note && y_max >= note.pitch-this.drawer.score.start_note)){
                this.drawer.hovered.elements.push(note);
            }
        }
        
    }
    hitScan(x:number, y:number, range:number, ctrl:boolean, alt:boolean){
        [x,y] = this.processInput(x,y);
        
        if (x<0) x=-0.01;
        if (x>1) x=0.99;
        if (y<0) y=0;
        if (y>1) y=0.99;
        
        if (this.drawer.drugged){ // if drugging
            this.drug(x,y,alt,ctrl);
        } else {
            [x, y] = this.getGrid(x,y);
            y = Math.floor(y);
            for (let note of this.drawer.score.notes){ // notes hit scan
                this.drawer.hovered.start = false;
                this.drawer.hovered.end = false;
                this.drawer.hovered.elements = [];
                if (y == note.pitch-this.drawer.score.start_note){
                    let s = note.start;
                    let flag = false;
                    if ((x-s<=range && x-s>=0) || (s-x<=range && s-x>=0)){ // check left side
                        this.drawer.hovered.start = true;
                        this.drawer.hovered.elements = [note];
                        flag = true;
                    }
                    s += note.duration;
                    if ((x-s<=range && x-s>=0) || (s-x<=range && s-x>=0)){ // check right side
                        this.drawer.hovered.end = true;
                        this.drawer.hovered.elements = [note];
                        flag = true;
                    }
                    if (x >= note.start && x <= s){ // check middle side
                        this.drawer.hovered.elements = [note];
                        flag = true;
                    }
                    if (flag) {
                        this.set(x,y);
                        return;
                    }
                }
            }
            this.set(x,y);
        }
    }
    private set(x:number, y:number){
        x = Math.floor(x);
        this.setSS1(x, y);
        this.setSS2(x, y);
    }
}