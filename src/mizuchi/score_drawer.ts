import Score from "./score";
import Selection from "./selection";
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
    drug_window:{cx:number,cy:number,cliX:number,cliY:number}|null = null;
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
        // const wrapper = document.getElementById('score-canvas-wrapper') as HTMLDivElement;
        // let isResizing = false;
        // let resizeEdge = { right: false, bottom: false, corner: false };
        // let startX = 0;
        // let startY = 0;

        // const MIN_WIDTH = 50;
        // const MIN_HEIGHT = 50;

        // // Настройка стилей для wrapper
        // wrapper.style.position = 'absolute';
        // wrapper.style.display = 'inline-block';
        // wrapper.style.border = '1px solid black';
        // wrapper.style.padding = '10px';
        // this.canvas.style.display = 'block';
        // wrapper.style.width = (canvas.width / devicePixelRatio +10) + 'px';
        // wrapper.style.height = (canvas.height / devicePixelRatio +10) + 'px';

        // // Функция для определения курсора
        // function getCursorStyle(e: MouseEvent): string {
        //     const rect = wrapper.getBoundingClientRect();
        //     const isRightEdge = e.clientX > rect.right - 10 && e.clientX < rect.right;
        //     const isBottomEdge = e.clientY > rect.bottom - 10 && e.clientY < rect.bottom;
        //     const isCorner = isRightEdge && isBottomEdge;
        
        //     if (isCorner) return 'nwse-resize';
        //     if (isRightEdge) return 'ew-resize';
        //     if (isBottomEdge) return 'ns-resize';
        //     return 'default';
        // }

        // // Обработчик для изменения курсора
        // wrapper.addEventListener('mousemove', (e) => {
        //     if (!isResizing) {
        //     wrapper.style.cursor = getCursorStyle(e);
        //     }
        // });
        
        // wrapper.addEventListener('mousedown', (e) => {
        //     const rect = wrapper.getBoundingClientRect();
        
        //     const isRightEdge = e.clientX > rect.right - 10 && e.clientX < rect.right;
        //     const isBottomEdge = e.clientY > rect.bottom - 10 && e.clientY < rect.bottom;
        //     const isCorner = isRightEdge && isBottomEdge;
        
        //     if (isRightEdge || isBottomEdge) {
        //     isResizing = true;
        //     resizeEdge = { right: isRightEdge, bottom: isBottomEdge, corner: isCorner };
        //     startX = e.clientX;
        //     startY = e.clientY;
        //     e.preventDefault();
        //     }
        // });
        
        // document.addEventListener('mousemove', (e) => {
        //     if (isResizing) {
        //       const dx = e.clientX - startX;
        //       const dy = e.clientY - startY;
          
        //       if (resizeEdge.right || resizeEdge.corner) {
        //         canvas.width = Math.max(MIN_WIDTH, canvas.width + dx);
        //       }
          
        //       if (resizeEdge.bottom || resizeEdge.corner) {
        //         canvas.height = Math.max(MIN_HEIGHT, canvas.height + dy);
        //       }
          
        //       startX = e.clientX;
        //       startY = e.clientY;
        //     }
        //   });
        
        // document.addEventListener('mouseup', () => {
        //     isResizing = false;
        //     resizeEdge = { right: false, bottom: false, corner: false };
        //     wrapper.style.cursor = 'default';
        // });
    }
    rectInput(e:MouseEvent){
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left)/rect.width;
        const y = (e.clientY - rect.top)/rect.height;
        return [x,y];
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
            // const [x,y] = this.rectInput(e);
            // this.controller.findNote(x,y, 0.2, e.shiftKey, e.ctrlKey);
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
            if (this.drug_window) {
                let x = this.drug_window.cliX + e.clientX - this.drug_window.cx;
                let y = this.drug_window.cliY + e.clientY - this.drug_window.cy;
                const w = this.canvas.width/devicePixelRatio
                const h = this.canvas.height/devicePixelRatio
                if (x < 0){
                    x = 0;
                    // this.drug_window.cliX = e.clientX;
                } 
                if (y < 0){
                    y = 0;
                    // this.drug_window.cliY = e.clientY;
                }
                if (x > window.innerWidth - w){
                    x = window.innerWidth - w;
                    // this.drug_window.cliX = e.clientX;
                }
                if (y > window.innerHeight - h){
                    y = window.innerHeight - h;
                    // this.drug_window.cliY = e.clientY;
                }
                console.log(this.drug_window);
                
                this.canvas.style.left = `${x}px`;
                this.canvas.style.top = `${y}px`;
            } else {
                const [x,y] = this.rectInput(e);
                this.render();
                this.controller.findNote(x, y, 0.2, e.shiftKey, e.ctrlKey);
            }
        });
        let clickCount = 0;
        this.canvas.addEventListener('pointerdown', (e) => {
            if (e.button == 2) {
                clickCount++;
                if (clickCount == 2) {
                    this.controller.setScore(null);
                    clickCount = 0;
                } else {
                    this.drug_window = {
                        cx: e.clientX, 
                        cy: e.clientY, 
                        cliX: parseFloat(this.canvas.style.left || "0"), 
                        cliY: parseFloat(this.canvas.style.top || "0")
                    };
                }
                setTimeout(() => clickCount = 0, 300);
            } else if (e.button == 0) {
                this.canvas.setPointerCapture(e.pointerId);
                this.note = false;
                if (this.hovered.note){
                    this.note = true;
                    if (e.ctrlKey) {
                        this.controller.addSelectedToChosen();
                    } else if (this.hovered.note && !this.score.selection.selected.includes(this.hovered.note)) {
                        this.controller.selectedToChosen();
                    } 
                } else if (!e.ctrlKey) {
                    this.score.selection.selected = [];
                }
                this.drugged = true;
                let [x,y] = this.rectInput(e);
                [x,y] = this.controller.processInput(x,y);
                [x,y] = this.controller.getGrid(x,y);
                y = Math.floor(y)
                this.score.selection.drugged_x = x;
                this.score.selection.drugged_y = y;
                x = Math.floor(x)
                this.render();
            }
        });
        this.canvas.addEventListener('pointerup', (e) => {
            if (e.button == 2) {
                this.drug_window = null;
            } else {
                this.canvas.releasePointerCapture(e.pointerId);
                this.controller.clearInterval();
                if (e.ctrlKey && !this.note){
                    this.controller.addSelectedToChosen();
                } else if (this.score.selection.selected.length==0){
                    this.controller.selectedToChosen();
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
            this.drug_window = null;
            this.render();
            this.controller.clearInterval();
        });
        
        this.render()
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.w, -this.h);
        this.ctx.font = "16px system-ui";
        this.renderPiano();
        this.renderGrid()
        this.renderNotes()
        if (this.hovered.note && !this.score.selection.selected.includes(this.hovered.note) || this.hovered.notes.length){
            this.renderSelected();
        }
        if (this.score.selection.selected.length) {
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
            // let pitch =  + this.score.selection.offset_pitch
            // if (note.pitch < this.score.start_note || note.pitch > this.score.start_note + this.notes_width_count-1) return;
            if (this.score.selection.selected.includes(note)){
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
                if (this.score.selection.selected.includes(note)) continue;
                this.ctx.beginPath();
                this.ctx.strokeStyle = "yellow";
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(this.gridX + note.start*this.note_w, this.gridY-(note.pitch-this.score.start_note+1)*this.note_h, note.duration*this.note_w, this.note_h);
                this.ctx.closePath();
            }
            if (this.sectorsSelection.x1==-1){
                return;
            }
            
            // const min = Math.min(this.sectorsSelection.y1,this.sectorsSelection.y2);
            // const max = Math.max(this.sectorsSelection.y1, this.sectorsSelection.y2);
            // let n = [1,3,6,8,10];
            // for (let i=0; i<max-min+1; i++){
            //     this.ctx.beginPath();
            //     this.ctx.lineWidth = 1;
            //     this.ctx.strokeStyle = "yellow";
            //     this.ctx.fillStyle = "yellow";
            //     if (!n.includes((min+i+this.score.start_note)%12)){
            //         this.ctx.fillRect(this.margin_left, this.gridY-(i+min+1)*this.note_h, this.pianoWidth*this.width, this.note_h);
            //     } else {
            //         this.ctx.strokeRect(this.margin_left, this.gridY-(i+min+1)*this.note_h, this.pianoWidth*this.width, this.note_h);
            //     }
            //     this.ctx.closePath();
            // }
        }
    }
    renderHovered(x:number){
        if (!this.hovered.note) return;
        this.ctx.beginPath();
        if (this.score.selection.selected.length){
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
        for (let note of this.score.selection.selected){
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
        this.ctx.strokeRect(this.gridX + x_min*this.note_w, this.gridY-(y_min-this.score.start_note)*this.note_h, this.note_w*x_len, -this.note_h*y_len);
        this.ctx.closePath();
    }
    renderSelection(){
        this.ctx.beginPath();
        this.ctx.fillStyle = "yellow";
        let s = this.score.selection;
        this.ctx.fillRect(this.gridX + (s.start + s.offset_start)*this.note_w, this.gridY, (s.end - s.start + s.offset_duration)*this.note_w, 2);
        this.ctx.fillRect(this.gridX + (s.start + s.offset_start)*this.note_w, this.gridY-this.height, (s.end - s.start + s.offset_duration)*this.note_w, -2);
        this.ctx.closePath();
    }
}