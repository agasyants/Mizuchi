import Score, { Selection } from "./score";
import Note from "./note";
import CommandPattern from "./CommandPattern";
import score_drawer_controller from "./score_drawer_controller";

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

    hovered:{note:Note|null,notes:Note[],start:boolean,end:boolean} = {note:null,notes:[],start:false,end:false}
    drugged:boolean = false;
    note:boolean = false;
    ctrl:boolean = false;
    controller:score_drawer_controller;

    sectorsSelection:{x1:number,y1:number,x2:number,y2:number} = {x1:-1, y1:-1, x2:-1, y2:-1}

    constructor(public canvas:HTMLCanvasElement, public score:Score){
        this.controller = new score_drawer_controller(this);
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
                    this.controller.zoom(Math.abs(e.deltaY)/e.deltaY);
                } else {
                    this.controller.scroll(Math.abs(e.deltaY)/e.deltaY);
                }
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
            if (e.code=="ControlLeft"){
                this.ctrl = true;
                this.render()
            }
            if (e.code!="KeyS" && e.code!="KeyI" && e.code!="Space"){
                e.stopPropagation();
            }
            if (e.code=="KeyC" && e.ctrlKey){
                this.controller.copy();
            }
            if (e.code=="KeyV" && e.ctrlKey){
                this.controller.paste();
            }
            if (e.code=="KeyZ" && e.ctrlKey){
                if (e.shiftKey){
                    this.commandPattern.redo();
                } else {
                    this.commandPattern.undo();
                } 
            }
            if (e.code=="KeyA" && e.ctrlKey){
                this.controller.selectAll();
            }
            if (e.code=="Delete" || e.code=="Backspace"){
                this.controller.delete();
            } 
            if (e.code=="KeyX" && e.ctrlKey){
                this.controller.cut();
            }
            if (e.code=="KeyD" && e.ctrlKey){
                this.controller.dublicate();
            }
            if (e.code=="ArrowUp")
                this.score.selection.offset_pitch+=1;
            if (e.code=="ArrowDown")
                this.score.selection.offset_pitch-=1;
            if (e.code=="ArrowLeft")
                this.score.selection.offset_start-=1;
            if (e.code=="ArrowRight")
                this.score.selection.offset_start+=1;
            if (e.code=="Enter"){
                this.controller.applyChanges(e.ctrlKey);
            }
            this.render();
        });
        this.canvas.addEventListener('dblclick', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left)/rect.width;
            const y = (e.clientY - rect.top)/rect.height;
            this.controller.doubleInput(x, y);
            this.render();
        });
        this.canvas.addEventListener('pointermove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left)/rect.width;
            const y = (e.clientY - rect.top)/rect.height;
            this.render();
            this.controller.findNote(x, y, 0.2, e.shiftKey, e.ctrlKey);
        });
        this.canvas.addEventListener('pointerdown', (e) => {
            this.canvas.setPointerCapture(e.pointerId);
            this.note = false;
            if (this.hovered.note){
                this.note = true;
                if (e.ctrlKey){
                    this.controller.addSelectedToChosen();
                } else if (this.hovered.note && !this.score.selection.notes.includes(this.hovered.note)) {
                    this.controller.selectedToChosen();
                } 
            } else if (!e.ctrlKey) {
                this.score.selection.notes = [];
            }
            this.drugged = true;
            const rect = this.canvas.getBoundingClientRect();
            let x = (e.clientX - rect.left)/rect.width;
            let y = (e.clientY - rect.top)/rect.height;
            [x,y] = this.controller.processInput(x,y);
            [x,y] = this.controller.getGrid(x,y);
            y = Math.floor(y)
            this.score.selection.drugged_x = x;
            this.score.selection.drugged_y = y;
            x = Math.floor(x)
            this.render();
        });
        this.canvas.addEventListener('pointerup', (e) => {
            this.canvas.releasePointerCapture(e.pointerId);
            if (e.ctrlKey && !this.note){
                this.controller.addSelectedToChosen();
            } else if (this.score.selection.notes.length==0){
                this.controller.selectedToChosen();
            } else {
                this.controller.applyChanges(e.ctrlKey);
            }
            const rect = this.canvas.getBoundingClientRect();
            let x = (e.clientX - rect.left)/rect.width;
            let y = (e.clientY - rect.top)/rect.height;
            [x,y] = this.controller.processInput(x,y);
            [x,y] = this.controller.getMatrix(x,y);
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
    
    render() {
        this.ctx.clearRect(0, 0, this.w, -this.h);
        this.ctx.font = "16px system-ui";
        this.renderPiano();
        this.renderGrid()
        this.renderNotes()
        if (this.hovered.note && !this.score.selection.notes.includes(this.hovered.note) ||this.hovered.notes.length){
            this.renderSelected();
        }
        if (this.score.selection.notes.length) {
            this.renderChosenNotes();
        }
        this.renderPianoLabels()
        let ss = this.sectorsSelection;
        if (!(ss.x2==-1 || ss.y2==-1 || (this.hovered.note && ss.x1==ss.x2 && ss.y1==ss.y2))){
            this.renderSector();
        } 
        this.renderSelection();
        if (this.hovered.note){
            if (this.hovered.start){
                this.renderHovered(this.hovered.note.start+this.score.selection.offset_start);
            } else if (this.hovered.end){
                this.renderHovered(this.hovered.note.start+this.hovered.note.duration+this.score.selection.offset_duration);
            }
        }
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
        if (this.hovered.note){
            this.ctx.beginPath();
            this.ctx.strokeStyle = "yellow";
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(this.gridX + this.hovered.note.start*this.note_w, this.gridY-(this.hovered.note.pitch-this.score.start_note+1)*this.note_h, this.hovered.note.duration*this.note_w, this.note_h);
            this.ctx.closePath();
        } else {
            for (let note of this.hovered.notes){
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
    }
    renderHovered(x:number){
        if (!this.hovered.note) return;
        this.ctx.beginPath();
        if (this.score.selection.notes.length){
            this.ctx.strokeStyle = "yellow";
        } else {
            this.ctx.strokeStyle = "blue";
        }
        this.ctx.lineWidth = 4;
        this.ctx.moveTo(this.gridX + x*this.note_w, this.gridY-(this.hovered.note.pitch-this.score.start_note)*this.note_h+2);
        this.ctx.lineTo(this.gridX + x*this.note_w, this.gridY-(this.hovered.note.pitch-this.score.start_note+1)*this.note_h-2);
        this.ctx.stroke()
        this.ctx.closePath();
    }
    renderChosenNotes(){
        for (let note of this.score.selection.notes){
            this.ctx.beginPath();
            this.ctx.strokeStyle = "blue";
            this.ctx.fillStyle = "blue";
            this.ctx.lineWidth = 2;
            let x = this.gridX + (note.start+this.score.selection.offset_start)*this.note_w;
            let y = this.gridY-(note.pitch-this.score.start_note+1+this.score.selection.offset_pitch)*this.note_h;
            this.ctx.strokeRect(x, y, (note.duration+this.score.selection.offset_duration)*this.note_w, this.note_h);
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
        let s = this.score.selection;
        this.ctx.fillRect(this.gridX + (s.start +  + s.offset_start)*this.note_w, this.gridY, (s.end - s.start + s.offset_duration)*this.note_w, 2);
        this.ctx.fillRect(this.gridX + (s.start +  + s.offset_start)*this.note_w, this.gridY-this.height, (s.end - s.start + s.offset_duration)*this.note_w, -2);
        this.ctx.closePath();
    }
    
}