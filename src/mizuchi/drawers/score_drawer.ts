import Score from "../data/score";
import { NoteSelection } from "../classes/selection";
import Note from "../classes/note";
import CommandPattern from "../classes/CommandPattern";
import score_drawer_controller from "./score_drawer_controller";
import hovered from "../classes/hovered";
import Drawer from "./Drawer";
import Mix from "../data/mix";


export default class ScoreDrawer extends Drawer{
    show_id:boolean = true;

    pianoWidth: number = 0.1;
    notes_width_count: number = 24;

    width:number=0;
    height:number=0;
    note_w:number=0;
    note_h:number=0;
    gridX:number=0;
    gridY:number=0;

    hovered:hovered = new hovered;

    buffer:NoteSelection = new NoteSelection;
    commandPattern:CommandPattern;

    drugged:boolean = false;
    note:boolean = false;
    ctrl:boolean = false;
    controller:score_drawer_controller;
    update_mix:Function = ()=>{};

    duration:number;

    sectorsSelection:{x1:number, y1:number, x2:number, y2:number} = {x1:-1, y1:-1, x2:-1, y2:-1}

    constructor(public canvas:HTMLCanvasElement, public score:Score, mix:Mix) {
        super(canvas);
        this.commandPattern = mix.commandPattern;
        this.setCanvasSize(canvas.width, canvas.height)
        this.controller = new score_drawer_controller(this);
        this.duration = Math.min(this.score.duration, this.score.loop_duration)
        this.initialize();
        this.render();
    }
    rectInput(e:MouseEvent){
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        return [x,y];
    }
    initialize(){
        this.canvas.onselectstart = function () { return false; }
        this.canvas.tabIndex = 2;
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY) {
                if (e.ctrlKey)
                    this.controller.zoom(Math.abs(e.deltaY)/e.deltaY);
                else
                    this.controller.scroll(Math.abs(e.deltaY)/e.deltaY);                
            }
            this.render();
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
                this.update_mix();
            }
            if (e.code=="KeyZ" && e.ctrlKey){
                if (e.shiftKey)
                    this.commandPattern.redo();
                else 
                    this.commandPattern.undo();
                this.update_mix();
            }
            if (e.code=="KeyA" && e.ctrlKey){
                this.controller.selectAll();
            }
            if (e.code=="Delete" || e.code=="Backspace"){
                this.controller.delete();
                this.update_mix();
            } 
            if (e.code=="KeyX" && e.ctrlKey){
                this.controller.cut();
                this.update_mix();
            }
            if (e.code=="KeyD" && e.ctrlKey){
                this.controller.dublicate();
                this.update_mix();
            }
            if (e.code=="ArrowUp"){
                this.score.selection.offset.pitch+=1;
                this.controller.scroll(-1);
            }
            if (e.code=="ArrowDown") {
                this.score.selection.offset.pitch-=1;
                this.controller.scroll(1);
            }
            if (e.code=="ArrowLeft")
                this.score.selection.offset.start-=1;
            if (e.code=="ArrowRight")
                this.score.selection.offset.start+=1;
            if (e.code=="Enter"){
                this.controller.applyChanges(e.ctrlKey);
            }
            this.render();
        });
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        })
        this.canvas.addEventListener('dblclick', (e) => {
            if (e.button==0){
                const [x,y] = this.rectInput(e);
                this.controller.doubleInput(x, y);
                this.render();
            }
        });
        this.canvas.addEventListener('pointermove', (e) => {
            const [x,y] = this.rectInput(e);
            if (this.stopRender) return;
            this.render();
            this.controller.hitScan(x, y, 0.2, e.ctrlKey, e.altKey);
        });
        this.canvas.addEventListener('pointerdown', (e) => {
            if (e.button == 0) {
                this.canvas.setPointerCapture(e.pointerId);
                this.note = false;
                if (this.hovered.elements.length){
                    this.note = true;
                    if (e.shiftKey) {
                        this.score.select(this.hovered.elements.slice(),this.sectorsSelection.x1,this.sectorsSelection.x2);
                        this.hovered.elements = [];
                    } else if (this.hovered.elements.length && !this.score.selection.elements.includes(this.hovered.elements[0])) {
                        if (this.score.selection.elements.length){
                            this.score.select(this.score.selection.elements.slice(),this.sectorsSelection.x1,this.sectorsSelection.x2);
                            this.score.select(this.hovered.elements.slice(),this.sectorsSelection.x1,this.sectorsSelection.x2);
                        } else {
                            this.score.select(this.hovered.elements.slice(),this.sectorsSelection.x1,this.sectorsSelection.x2);
                        }
                    } 
                } else if (!e.shiftKey && this.score.selection.elements.length) {
                    this.score.select(this.score.selection.elements.slice(),this.sectorsSelection.x1,this.sectorsSelection.x2);
                }
                this.drugged = true;
                let [x,y] = this.rectInput(e);
                [x,y] = this.controller.processInput(x,y);
                [x,y] = this.controller.getGrid(x,y);
                y = Math.floor(y);
                this.score.selection.drugged_x = x;
                this.score.selection.drugged_y = y;
                x = Math.floor(x);
                this.render();
            }
        });
        this.canvas.addEventListener('pointerup', (e) => {
            if (e.button == 0) {
                this.canvas.releasePointerCapture(e.pointerId);
                this.controller.clearInterval();
                if (e.shiftKey && !this.note && this.hovered.elements.length){
                    this.score.select(this.hovered.elements.slice(),this.sectorsSelection.x1,this.sectorsSelection.x2);
                    this.hovered.elements = [];
                } else if (this.score.selection.elements.length == 0 && this.hovered.elements.length){
                    if (this.score.selection.elements.length){
                        this.score.select(this.score.selection.elements.slice(),this.sectorsSelection.x1,this.sectorsSelection.x2);
                        this.score.select(this.hovered.elements.slice(),this.sectorsSelection.x1,this.sectorsSelection.x2);
                    } else {
                        this.score.select(this.hovered.elements.slice(),this.sectorsSelection.x1,this.sectorsSelection.x2);
                        this.hovered.elements = [];
                    }
                } else {
                    this.controller.applyChanges(e.ctrlKey);
                }
                let [x,y] = this.rectInput(e);
                [x,y] = this.controller.processInput(x,y);
                [x,y] = this.controller.getMatrix(x,y);
                this.score.selection.clear();
                this.drugged = false;
                this.note = false;
                this.render();
            }
        });
        this.canvas.addEventListener('pointerleave', () => {
            this.sectorsSelection = {x1:-1, y1:-1, x2:-1, y2:-1}
            this.render();
            this.controller.clearInterval();
        });
        
        this.render()
    }
    setCanvasSize(width: number, height: number): void {
        this.ctx.translate(0, -this.h)
        super.setCanvasSize(width, height)
        this.ctx.translate(0, this.h)
        this.width = (this.w - 2*this.margin_left - this.pianoWidth*this.width);
        this.height = (this.h - 2*this.margin_top);
        this.note_h = this.height/this.notes_width_count;
        this.note_w = this.width/this.duration;
        this.gridX = this.margin_left + this.pianoWidth*this.width;
        this.gridY = -this.margin_top;
        this.render();
    }
    render(){
        this.duration = Math.min(this.score.duration, this.score.loop_duration)
        requestAnimationFrame(()=>{this._render()})
    }
    private _render() {
        this.ctx.clearRect(0, 0, this.w, -this.h);
        this.renderGrid()
        this.renderPiano();
        this.renderNotes()
        if (!this.score.selection.elements.includes(this.hovered.elements[0]) || this.hovered.elements.length>1){
            this.renderSelected();
        }
        this.renderSector();
        this.renderSelection();
        if (this.score.selection.elements.length) {
            this.renderChosenNotes();
        }
        this.renderPianoLabels();
        if (this.hovered.elements.length){
            const note = this.hovered.elements[0];
            if (this.hovered.start){
                this.renderHovered(note.start + this.score.selection.offset.start);
            } else if (this.hovered.end){
                this.renderHovered(note.start + note.duration + this.score.selection.offset.duration);
            }
        }
    }
    private renderPiano(){
        let n = [1,3,6,8,10]
        this.ctx.lineWidth = 3;
        for (let i = 0; i < this.notes_width_count; i++){
            if (!n.includes((i+this.score.lowest_note)%12)){
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
    private renderPianoLabels(){
        this.ctx.lineWidth = 2;
        for (let i = 0; i < this.notes_width_count; i++){
            this.ctx.beginPath();
            let k = Math.floor(Math.min(this.height,this.width)/30);
            this.ctx.font = k+"px system-ui";
            this.ctx.strokeStyle = "red";
            this.ctx.lineWidth = k/10;
            this.ctx.strokeText(Note.numberToPitch(this.score.lowest_note+i), this.margin_left+k*0.3, -this.margin_top - i*this.note_h-this.note_h*0.2);
            this.ctx.lineWidth = 1;
        }
    }
    private renderGrid(){
        this.ctx.lineWidth = 1;
        const n = [1,3,6,8,10];
        if (this.score.selection.offset.pitch){
            for (let i = 0; i < this.notes_width_count; i++){
                this.ctx.beginPath();
                if (n.includes((i+this.score.lowest_note)%12))
                    this.ctx.fillStyle = "rgba(255,100,100,0.2)";
                else
                    this.ctx.fillStyle = "black";
                this.ctx.fillRect(this.gridX, this.gridY - i*this.note_h, this.width, -this.note_h);
                this.ctx.closePath();
            }
        }
        const opas = Math.pow((1-this.notes_width_count/120),1.5).toString();
        
        // horizontal
        for (let i = 0; i < this.notes_width_count+1; i++){
            this.ctx.beginPath();
            this.ctx.strokeStyle = "rgba(200,200,200,"+opas+")";
            this.ctx.moveTo(this.gridX, this.gridY - i*this.note_h);
            this.ctx.lineTo(this.gridX + this.width, this.gridY - i*this.note_h);
            this.ctx.stroke();
            this.ctx.closePath();
        }
        // vertical
        for (let i = 0; i < this.duration+1; i++){
            this.ctx.beginPath();
            this.ctx.strokeStyle = "rgba(150,150,150,"+opas+")";
            // console.log(this.score.selection.offset);
            if (this.score.selection.offset.start || this.score.selection.offset.duration){
                this.ctx.strokeStyle = "rgb(150,150,150)";
                if (i % 8 == 0)
                    this.ctx.lineWidth = 2.4;
                else if (i % 4 == 0)
                    this.ctx.lineWidth = 2;
                else if (i % 2 == 0) 
                    this.ctx.lineWidth = 1.5;
                else
                    this.ctx.lineWidth = 1;
            } else {
                if (i % 4 == 0)
                    this.ctx.lineWidth = 1.8;
                else if (i % 2 == 0) 
                    this.ctx.lineWidth = 1.2;
                else
                    this.ctx.lineWidth = 1;
            }
            this.ctx.moveTo(this.gridX + i*this.note_w, this.gridY);
            this.ctx.lineTo(this.gridX + i*this.note_w, this.gridY - this.height);
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }
    private renderNote(start:number, dur:number, pitch:number, id:number){
        this.ctx.beginPath();
        this.ctx.fillStyle = "red";
        this.ctx.fillRect(this.gridX + start*this.note_w, this.gridY-(pitch-this.score.lowest_note+1)*this.note_h, dur*this.note_w, this.note_h);
        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.gridX + start*this.note_w, this.gridY-(pitch-this.score.lowest_note+1)*this.note_h, dur*this.note_w, this.note_h);
        
        if (this.show_id) this.ctx.strokeText(id.toString(), this.gridX + start*this.note_w+10, this.gridY-(pitch-this.score.lowest_note+1)*this.note_h+16)
        
        this.ctx.closePath();
    }
    private renderNotes(){
        this.score.notes.forEach(n => {
            if (this.score.selection.elements.includes(n)){
                const o = this.score.selection.offset;
                this.renderNote(n.start+o.start, n.duration+o.duration, n.pitch+o.pitch, n.id);
                if (this.ctrl){
                    this.renderNote(n.start, n.duration, n.pitch, n.id);
                }
            } else {
                this.renderNote(n.start, n.duration, n.pitch, n.id);
            }
        });
    }
    private renderSelected(){
        if (this.hovered.elements.length==1){
            const note = this.hovered.elements[0]
            this.ctx.beginPath();
            this.ctx.strokeStyle = "yellow";
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(this.gridX + note.start*this.note_w, this.gridY-(note.pitch-this.score.lowest_note+1)*this.note_h, note.duration*this.note_w, this.note_h);
            this.ctx.closePath();
        } else {
            for (let note of this.hovered.elements){
                if (this.score.selection.elements.includes(note)) continue;
                this.ctx.beginPath();
                this.ctx.strokeStyle = "yellow";
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(this.gridX + note.start*this.note_w, this.gridY-(note.pitch-this.score.lowest_note+1)*this.note_h, note.duration*this.note_w, this.note_h);
                this.ctx.closePath();
            }
            // if (this.sectorsSelection.x1==-1){
            //     return;
            // }            
        }
    }
    private renderHovered(x:number){
        if (!this.hovered.elements.length) return;
        this.ctx.beginPath();
        if (this.score.selection.elements.length){
            this.ctx.strokeStyle = "yellow";
        } else {
            this.ctx.strokeStyle = "blue";
        }
        this.ctx.lineWidth = 4;
        this.ctx.moveTo(this.gridX + x*this.note_w, this.gridY-(this.hovered.elements[0].pitch-this.score.lowest_note)*this.note_h+2);
        this.ctx.lineTo(this.gridX + x*this.note_w, this.gridY-(this.hovered.elements[0].pitch-this.score.lowest_note+1)*this.note_h-2);
        this.ctx.stroke()
        this.ctx.closePath();
    }
    private renderChosenNotes(){
        for (let note of this.score.selection.elements){
            this.ctx.beginPath();
            this.ctx.strokeStyle = "blue";
            this.ctx.fillStyle = "blue";
            this.ctx.lineWidth = 2;
            const x = this.gridX + (note.start+this.score.selection.offset.start)*this.note_w;
            const y = this.gridY-(note.pitch-this.score.lowest_note+1+this.score.selection.offset.pitch)*this.note_h;
            this.ctx.strokeRect(x, y, (note.duration+this.score.selection.offset.duration)*this.note_w, this.note_h);
            const n = [1,3,6,8,10];
            if (n.includes((note.pitch+this.score.selection.offset.pitch)%12)){
                this.ctx.fillRect(this.margin_left, y, this.pianoWidth*this.width, this.note_h);
            } else {
                this.ctx.strokeRect(this.margin_left, y, this.pianoWidth*this.width, this.note_h);
            }
            this.ctx.closePath();
        }
    }
    private renderSector(){
        const ss = this.sectorsSelection;
        const x_min = Math.min(ss.x1,this.sectorsSelection.x2); 
        const x_len = Math.max(ss.x1, ss.x2)-x_min+1;
        const y_min = Math.min(ss.y1,this.sectorsSelection.y2);
        const y_len = Math.max(ss.y1, ss.y2)-y_min+1;
        this.ctx.beginPath();
        this.ctx.strokeStyle = "yellow";
        this.ctx.lineWidth = 2;
        if (!(ss.x2==-1 || ss.y2==-1 || (this.hovered.elements.length && ss.x1==ss.x2 && ss.y1==ss.y2))){
            this.ctx.strokeRect(this.gridX + x_min*this.note_w, this.gridY-(y_min-this.score.lowest_note)*this.note_h, this.note_w*x_len, -this.note_h*y_len);
        }
        for (let i = y_min-this.score.lowest_note; i < y_min+y_len-this.score.lowest_note; i++){
            this.ctx.beginPath();
            this.ctx.strokeStyle = "red";
            this.ctx.strokeRect(this.margin_left, -this.margin_top - (i+1)*this.note_h, this.pianoWidth*this.width, this.note_h);
            this.ctx.fillStyle = "yellow";
            this.ctx.fillRect(this.margin_left, -this.margin_top - (i+1)*this.note_h, this.pianoWidth*this.width, this.note_h);
            this.ctx.closePath();
        }
        this.ctx.closePath();
    }
    private renderSelection(){
        this.ctx.beginPath();
        this.ctx.fillStyle = "yellow";
        let s = this.score.selection;
        this.ctx.fillRect(this.gridX + (s.start + s.offset.start)*this.note_w, this.gridY, (s.end - s.start + s.offset.duration)*this.note_w, 2);
        this.ctx.fillRect(this.gridX + (s.start + s.offset.start)*this.note_w, this.gridY-this.height, (s.end - s.start + s.offset.duration)*this.note_w, -2);
        this.ctx.closePath();
    }
}