import Score, { Selection } from "./score";
import Note from "./note";
import CommandPattern, { Complex, Create, Delete, Move } from "./CommandPattern";

export default class ScoreDrawer{
    pianoWidth: number = 0.1;
    notes_width_count: number = 24;
    max_note: number = 127 - this.notes_width_count;

    w:number;
    h:number;
    margin_top:number;
    margin_left:number;
    width:number;
    height:number;
    ctx:CanvasRenderingContext2D;
    note_w:number;
    note_h:number;
    gridX:number;
    gridY:number;
    buffer: Selection = new Selection;
    commandPattern:CommandPattern = new CommandPattern();

    selectedNotes:Note[] = [];
    drugged:boolean = false;
    note:boolean = false;
    ctrl:boolean = false;

    sectorsSelection = {x1:-1, y1:-1, x2:-1, y2:-1}
    constructor(public canvas:HTMLCanvasElement, public score:Score){

        this.w = this.canvas.width = canvas.width * devicePixelRatio;
        this.h = this.canvas.height = canvas.height * devicePixelRatio;
        this.canvas.style.width = canvas.width / devicePixelRatio + 'px';
        this.canvas.style.height = canvas.height / devicePixelRatio + 'px';
        this.ctx = canvas.getContext('2d') || new CanvasRenderingContext2D();
        this.ctx.translate(0, this.h)
        this.margin_top = canvas.height/20;
        this.margin_left = this.margin_top;
        this.width = (this.w - 2*this.margin_left - this.pianoWidth*canvas.width);
        this.height = (this.h - 2*this.margin_top);
        this.note_h = this.height/this.notes_width_count;
        this.note_w = this.width/score.duration;
        this.gridX = this.margin_left + this.pianoWidth*this.width;
        this.gridY = -this.margin_top;
        this.initialize();
    }
    initialize(){
        this.canvas.onselectstart = function () { return false; }
        this.canvas.tabIndex = 2;
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY) {
                if (e.ctrlKey){
                    this.zoom(Math.abs(e.deltaY)/e.deltaY);
                } else {
                    this.scroll(Math.abs(e.deltaY)/e.deltaY);
                }
            }
        });
        this.canvas.addEventListener('keydown', (e) => {
            if (e.code=="ControlLeft"){
                this.ctrl = true;
                this.render()
            }
        });
        this.canvas.addEventListener('keyup', (e) => {
            if (e.code=="ControlLeft"){
                this.ctrl = false;
                this.render()
            }
        });
        this.canvas.addEventListener("keydown", (e) => {
            e.preventDefault();
            if (e.code!="KeyS" && e.code!="KeyI"){
                e.stopPropagation();
            }
            if (e.code=="KeyC" && e.ctrlKey){
                this.copy();
            }
            if (e.code=="KeyV" && e.ctrlKey){
                this.paste();
            }
            if (e.code=="KeyZ" && e.ctrlKey){
                if (e.shiftKey){
                    this.commandPattern.redo();
                } else {
                    this.commandPattern.undo();
                } 
            }
            if (e.code=="KeyA" && e.ctrlKey){
                this.selectAll();
            }
            if (e.code=="Delete" || e.code=="Backspace"){
                this.delete();
            } 
            if (e.code=="KeyX" && e.ctrlKey){
                this.cut();
            }
            if (e.code=="KeyD" && e.ctrlKey){
                this.dublicate();
            }
            this.render();
        });
        this.canvas.addEventListener('dblclick', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left)/rect.width;
            const y = (e.clientY - rect.top)/rect.height;
            this.doubleInput(x, y);
            this.render();
        });
        this.canvas.addEventListener('pointermove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left)/rect.width;
            const y = (e.clientY - rect.top)/rect.height;
            this.render();
            this.findNote(x, y, 0.4, e.shiftKey, e.ctrlKey);
        });
        this.canvas.addEventListener('pointerdown', (e) => {
            this.note = false;
            if (this.selectedNotes.length){
                this.note = true;
                if (e.ctrlKey){
                    this.addSelectedToChosen();
                } else {
                    if (!this.score.selection.notes.includes(this.selectedNotes[0])) {
                        this.selectedToChosen();
                    }
                } 
            } else if (!e.ctrlKey) {
                this.score.selection.notes = [];
            }
            this.drugged = true;
            const rect = this.canvas.getBoundingClientRect();
            let x = (e.clientX - rect.left)/rect.width;
            let y = (e.clientY - rect.top)/rect.height;
            [x,y] = this.processInput(x,y);
            [x,y] = this.getMatrix(x,y);
            this.sectorsSelection.x1 = x;
            this.sectorsSelection.y1 = y;
            this.score.selection.drugged_x = x;
            this.score.selection.drugged_y = y;
            this.render();
        });
        this.canvas.addEventListener('pointerup', (e) => {
            if (e.ctrlKey && !this.note){
                this.addSelectedToChosen();
            } else if (this.score.selection.notes.length==0){
                this.selectedToChosen();
            } else {
                this.applyChanges(e.ctrlKey);
            }
            const rect = this.canvas.getBoundingClientRect();
            let x = (e.clientX - rect.left)/rect.width;
            let y = (e.clientY - rect.top)/rect.height;
            [x,y] = this.processInput(x,y);
            [x,y] = this.getMatrix(x,y);
            this.sectorsSelection.x1 = x;
            this.sectorsSelection.y1 = y;
            this.score.selection.clear();
            this.drugged = false;
            this.note = false;
            this.render();
        });
        this.canvas.addEventListener('pointerleave', () => {
            this.sectorsSelection = {x1:-1, y1:-1, x2:-1, y2:-1}
            this.render();
        });

        this.render()
    }
    setScore(score:Score|null){
        if (score){
            this.score = score;
            this.canvas.style.display = 'block';
            this.canvas.focus();
            this.render();
        } else {
            this.canvas.blur();
            this.canvas.style.display = 'none';
        }
    }
    scroll(i:number){
        this.score.start_note -= i;
        if (this.score.start_note < 0) this.score.start_note = 0;
        if (this.score.start_note > this.max_note) this.score.start_note = this.max_note;
        if (this.drugged){
            this.score.selection.offset_pitch += (this.sectorsSelection.y1-i);
        }
        this.render();
    }
    copy(){
        this.buffer = this.score.selection.clone();
    }
    dublicate(){
        let paste = [];
        for (let note of this.score.selection.notes){
            paste.push(note.clone());
        }
        let s = this.score.selection;
        let commands = [new Move(this.score, s, [s.end-s.start,0,0]), new Create(this.score, paste)]
        this.commandPattern.addCommand(new Complex(commands))
    }
    paste(){
        let paste = [];
        for (let note of this.buffer.notes){
            paste.push(new Note(note.pitch, note.start + this.score.selection.start, note.duration))
        }
        this.commandPattern.addCommand(new Create(this.score, paste));
    }
    cut(){
        this.copy();
        this.delete();
    }
    delete(){
        this.commandPattern.addCommand(new Delete(this.score, this.score.selection.notes));
        this.score.selection.notes = [];
    }
    applyChanges(ctrl:boolean){
        let s = this.score.selection;
        if (ctrl){
            if (s.offset_start || s.offset_duration || s.offset_pitch) {
                let commands = [];
                let notes = s.cloneNotes();
                commands.push(new Move(this.score, s, [s.offset_start, s.offset_duration, s.offset_pitch]));
                commands.push(new Create(this.score, notes));
                this.commandPattern.addCommand(new Complex(commands));
            } 
            s.clear();
        } else {
            if (s.offset_start || s.offset_duration || s.offset_pitch) {
                this.commandPattern.addCommand(new Move(this.score, s, [s.offset_start, s.offset_duration, s.offset_pitch]));
            } 
            s.clear();
        }
    }
    zoom(i:number){
        if (this.score.start_note >= this.max_note && this.score.start_note <= 0 && i==1) return;
        this.notes_width_count += i*2;
        console.log(this.score.start_note,this.max_note);
        if (this.score.start_note >= this.max_note){ 
            this.score.start_note -= i*2;
        } else if (this.score.start_note > 0) {
            this.score.start_note -= i
        }
        if (this.drugged){
            this.score.selection.offset_pitch += (this.sectorsSelection.y1-i);
            this.score.selection.offset_start += this.sectorsSelection.x1;
        }
        this.max_note = 127 - this.notes_width_count;
        this.note_h = this.height/this.notes_width_count;
        this.render();
    }
    selectAll(){
        this.score.selection.notes = [];
        for (let note of this.score.notes){
            this.score.selection.notes.push(note);
            this.score.selection.start = Math.min(this.score.selection.start, note.start);
            this.score.selection.end = Math.max(this.score.selection.end, note.start+note.duration);
        }
    }
    selectedToChosen(){
        this.score.selection.notes = this.selectedNotes;
        this.score.selection.start = this.sectorsSelection.x1;
        this.score.selection.end = this.sectorsSelection.x2+1;
        for (let note of this.score.selection.notes){
            this.score.selection.start = Math.min(this.score.selection.start, note.start);
            this.score.selection.end = Math.max(this.score.selection.end, note.start+note.duration);
        }
    }
    addSelectedToChosen(){
        this.score.selection.start = Math.min(this.score.selection.start, this.sectorsSelection.x1);
        this.score.selection.end = Math.max(this.score.selection.end, this.sectorsSelection.x2+1);
        for (let note of this.selectedNotes){
            if (!this.score.selection.notes.includes(note)){
                this.score.selection.start = Math.min(this.score.selection.start, note.start);
                this.score.selection.end = Math.max(this.score.selection.end, note.start+note.duration);
                this.score.selection.notes.push(note);
            }
        }
    }
    render() {
        this.ctx.clearRect(0, 0, this.w, -this.h);
        this.ctx.font = "16px system-ui";
        this.renderPiano();
        this.renderGrid()
        this.renderNotes()
        this.renderSelected();
        if (this.score.selection.notes.length) {
            this.renderChosenNotes();
        }
        this.renderPianoLabels()
        let ss = this.sectorsSelection;
        if (!(ss.x2==-1 || ss.y2==-1 || (this.selectedNotes.length==1 && ss.x1==ss.x2 && ss.y1==ss.y2))){
            this.renderSector();
        } 
        this.renderSelection();
        
    }
    renderPiano(){
        let n = [1,3,6,8,10]
        for (let i = 0; i < this.notes_width_count; i++){
            if (!n.includes((i+this.score.start_note)%12)){
                this.ctx.beginPath();
                this.ctx.strokeStyle = "red";
                this.ctx.strokeRect(this.margin_left, -this.margin_top - (i+1)*this.note_h, this.pianoWidth*this.width, this.note_h);
                this.ctx.fillStyle = "white";
                this.ctx.fillRect(this.margin_left, -this.margin_top - (i+1)*this.note_h, this.pianoWidth*this.width, this.note_h);
                this.ctx.closePath();
            } else {
                this.ctx.beginPath();
                this.ctx.strokeStyle = "red";
                this.ctx.strokeRect(this.margin_left, -this.margin_top - (i+1)*this.note_h, this.pianoWidth*this.width, this.note_h);
                this.ctx.closePath();
            }
        }
    }
    renderPianoLabels(){
        this.ctx.lineWidth = 2;
        for (let i = 0; i < this.notes_width_count; i++){
            this.ctx.beginPath();
            this.ctx.strokeStyle = "red";
            this.ctx.lineWidth = 1.6;
            this.ctx.strokeText(Note.numberToPitch(this.score.start_note+i), this.margin_left+5, -this.margin_top - i*this.note_h-this.note_h*0.2);
            this.ctx.lineWidth = 1;
        }
    }
    renderGrid(){
        this.ctx.lineWidth = 1;
        // horizontal
        for (let i = 0; i < this.notes_width_count+1; i++){
            this.ctx.beginPath();
            this.ctx.strokeStyle = "grey";
            this.ctx.moveTo(this.gridX, this.gridY - i*this.note_h);
            this.ctx.lineTo(this.gridX + this.width, this.gridY - i*this.note_h);
            this.ctx.stroke();
            this.ctx.closePath();
        }
        // vertical
        for (let i = 0; i < this.score.duration+1; i++){
            this.ctx.beginPath();
            this.ctx.strokeStyle = "grey";
            if (i%4==0)
                this.ctx.lineWidth = 1.7;
            else
                this.ctx.lineWidth = 1;
            this.ctx.moveTo(this.gridX + i*this.note_w, this.gridY);
            this.ctx.lineTo(this.gridX + i*this.note_w, this.gridY - this.height);
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }
    renderNote(n:Note){
        this.ctx.beginPath();
        this.ctx.fillStyle = "red";
        this.ctx.fillRect(this.gridX + n.start*this.note_w, this.gridY-(n.pitch-this.score.start_note+1)*this.note_h, n.duration*this.note_w, this.note_h);
        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.gridX + n.start*this.note_w, this.gridY-(n.pitch-this.score.start_note+1)*this.note_h, n.duration*this.note_w, this.note_h);
        this.ctx.closePath();
    }
    renderNotes(){
        this.score.notes.forEach(note => {
            if (note.pitch < this.score.start_note || note.pitch > this.score.start_note + this.notes_width_count-1) return;
            if (this.score.selection.notes.includes(note)){
                let n = note.clone();
                n.start += this.score.selection.offset_start;
                n.duration += this.score.selection.offset_duration;
                n.pitch += this.score.selection.offset_pitch;
                this.renderNote(n);
                if (this.ctrl){
                    this.renderNote(note);
                }
            } else {
                this.renderNote(note);
            }
        });
    }
    renderSelected(){
        for (let note of this.selectedNotes){
            if (this.score.selection.notes.includes(note)) continue;
            this.ctx.beginPath();
            this.ctx.strokeStyle = "yellow";
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(this.gridX + note.start*this.note_w, this.gridY-(note.pitch-this.score.start_note+1)*this.note_h, note.duration*this.note_w, this.note_h);
            this.ctx.closePath();
        }
        if (this.sectorsSelection.x1==-1){
            return;
        }
        const min = Math.min(this.sectorsSelection.y1,this.sectorsSelection.y2);
        const max = Math.max(this.sectorsSelection.y1, this.sectorsSelection.y2);
        let n = [1,3,6,8,10];
        for (let i=0; i<max-min+1; i++){
            this.ctx.beginPath();
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = "yellow";
            this.ctx.fillStyle = "yellow";
            if (!n.includes((min+i+this.score.start_note)%12)){
                this.ctx.fillRect(this.margin_left, this.gridY-(i+min+1)*this.note_h, this.pianoWidth*this.width, this.note_h);
            } else {
                this.ctx.strokeRect(this.margin_left, this.gridY-(i+min+1)*this.note_h, this.pianoWidth*this.width, this.note_h);
            }
            this.ctx.closePath();
        }
    }
    renderChosenNotes(){
        for (let note of this.score.selection.notes){
            this.ctx.beginPath();
            this.ctx.strokeStyle = "blue";
            this.ctx.fillStyle = "blue";
            this.ctx.lineWidth = 2;
            let x = this.gridX + (note.start+this.score.selection.offset_start)*this.note_w;
            let y = this.gridY-(note.pitch-this.score.start_note+1+this.score.selection.offset_pitch)*this.note_h;
            this.ctx.strokeRect(x, y, note.duration*this.note_w, this.note_h);
            let n = [1,3,6,8,10];
            if (n.includes((note.pitch+this.score.selection.offset_pitch)%12)){
                this.ctx.fillRect(this.margin_left, y, this.pianoWidth*this.width, this.note_h);
            } else {
                this.ctx.strokeRect(this.margin_left, y, this.pianoWidth*this.width, this.note_h);
            }
            this.ctx.closePath();
        }
    }
    renderSector(){
        let x_min = Math.min(this.sectorsSelection.x1,this.sectorsSelection.x2); 
        let x_len = Math.max(this.sectorsSelection.x1, this.sectorsSelection.x2)-x_min+1;
        let y_min = Math.min(this.sectorsSelection.y1,this.sectorsSelection.y2);
        let y_len = Math.max(this.sectorsSelection.y1, this.sectorsSelection.y2)-y_min+1;
        this.ctx.beginPath();
        this.ctx.strokeStyle = "yellow";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.gridX + x_min*this.note_w, this.gridY-y_min*this.note_h, this.note_w*x_len, -this.note_h*y_len);
        this.ctx.closePath();
    }
    renderSelection(){
        this.ctx.beginPath();
        this.ctx.fillStyle = "yellow";
        this.ctx.fillRect(this.gridX + this.score.selection.start*this.note_w, this.gridY, (this.score.selection.end - this.score.selection.start)*this.note_w, 2);
        this.ctx.fillRect(this.gridX + this.score.selection.start*this.note_w, this.gridY-this.height, (this.score.selection.end - this.score.selection.start)*this.note_w, -2);
        this.ctx.closePath();
    }
    doubleInput(x:number, y:number){
        if (this.selectedNotes.length) {
            this.delete();
        } else {
            [x,y] = this.processInput(x, y);
            [x,y] = this.getMatrix(x, y);
            this.commandPattern.addCommand(new Create(this.score, [new Note(y+this.score.start_note,x,1)]));
        }        
        this.selectedNotes = [];
        this.render();
    }
    getMatrix(x:number,y:number){
        return [Math.floor(x*this.score.duration), Math.floor(y*this.notes_width_count)];
    }
    processInput(x:number, y:number){
        x = (x - this.margin_left/this.canvas.width) * this.canvas.width/this.width - this.pianoWidth;
        y = 1-(y-this.margin_top*2/this.canvas.width)*this.canvas.height/this.height;
        return [x,y];
    }
    moveOffset(x:number, y:number){
        this.score.selection.offset_start = x - this.score.selection.drugged_x;
        this.score.selection.offset_pitch = y - this.score.selection.drugged_y;
    }
    moveDuration(note:Note, x:number){
        note.duration = x-this.selectedNotes[0].start+1;
    }
    moveStart(note:Note, x:number){
        note.duration = note.duration+this.sectorsSelection.x1-x;
        note.start = note.start-this.sectorsSelection.x1+x;
    }
    drug(x:number, y:number, range:number, shift:boolean, ctrl:boolean){
        let xn = x*this.score.duration;
        [x, y] = this.getMatrix(x, y);
        if (this.score.selection.notes.length && this.selectedNotes.length && !ctrl){
            if (shift){
                if (this.selectedNotes[0].start<=xn && xn<=range+this.selectedNotes[0].start){
                    for (let note of this.score.selection.notes)  
                        this.moveStart(note, Math.floor(xn-range/2));
                } else if (this.selectedNotes[0].start+this.selectedNotes[0].duration>=xn && xn>=this.selectedNotes[0].start+this.selectedNotes[0].duration-range) {
                    for (let note of this.score.selection.notes)
                        this.moveDuration(note, Math.floor(xn+range/2));
                }
            } else {
                this.moveOffset(x,y);
            }
            this.sectorsSelection.x1 = x;
            this.sectorsSelection.y1 = y;
            this.sectorsSelection.x2 = x;
            this.sectorsSelection.y2 = y;
            return;
        } else if (ctrl) {
            this.moveOffset(x,y);
        } else {
            this.sectorsSelection.x2 = x;
            this.sectorsSelection.y2 = y;
            this.select();
        }
    }
    select(){
        this.selectedNotes = [];
        let x_min = Math.min(this.sectorsSelection.x1,this.sectorsSelection.x2); 
        let x_max = Math.max(this.sectorsSelection.x1, this.sectorsSelection.x2);
        let y_min = Math.min(this.sectorsSelection.y1,this.sectorsSelection.y2);
        let y_max = Math.max(this.sectorsSelection.y1, this.sectorsSelection.y2);
        for (let note of this.score.notes){
            if ((x_min <= note.start+note.duration-1 && note.start <= x_max) && (y_min<=note.pitch-this.score.start_note && y_max >= note.pitch-this.score.start_note)){
                this.selectedNotes.push(note);
            }
        }
    }
    findNote(x:number, y:number, range:number, shift:boolean, ctrl:boolean){
        [x,y] = this.processInput(x,y);;
        if (x >= 0 && x <= 1 && y >= 0 && y <= 1){
            if (this.drugged){
                this.drug(x,y,range,shift,ctrl)
            } else {
                [x, y] = this.getMatrix(x, y);
                this.sectorsSelection.x1 = x;
                this.sectorsSelection.y1 = y;
                this.sectorsSelection.x2 = x;
                this.sectorsSelection.y2 = y;
                this.select()
            }
        }
    }
}