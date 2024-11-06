import Score from "./score";
import Note from "./note";

export default class ScoreDrawer{
    pianoWidth: number = 0.1;
    notes_width_count: number = 24;
    start_note: number = 16;
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
    buffer:Note[] = [];

    selectedNotes:Note[] = [];
    chosenNotes:Note[] = [];
    drugged:boolean = false;

    sectorsSelection = {x1:-1, y1:-1, x2:-1, y2:-1}
    selection = {chosenNotes:[],start:0,end:0}
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
        canvas.onselectstart = function () { return false; }
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY) {
                if (e.ctrlKey){
                    this.zoom(Math.abs(e.deltaY)/e.deltaY);
                } else {
                    this.scroll(Math.abs(e.deltaY)/e.deltaY);
                }
            }
        });
        window.addEventListener("keydown", (e) => {
            if (e.code=="KeyC" && e.ctrlKey){
                // e.preventDefault();
                this.copy();
            }
            if (e.code=="KeyV" && e.ctrlKey){
                e.preventDefault();
                this.paste();
            }
        });
        canvas.addEventListener('dblclick', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left)/rect.width;
            const y = (e.clientY - rect.top)/rect.height;
            this.doubleInput(x, y);
            this.render();
        });
        canvas.addEventListener('pointermove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left)/rect.width;
            const y = (e.clientY - rect.top)/rect.height;
            this.render();
            this.findNote(x, y, 0.4, e.shiftKey);
        });
        canvas.addEventListener('pointerdown', (e) => {
            if (this.selectedNotes.length==1){
                if (e.ctrlKey){
                    this.addSelectedToChosen();
                } else if (this.chosenNotes.length<=1){
                    this.selectedToChosen();
                } 
            } else if (!e.ctrlKey) {
                this.chosenNotes = [];
            }
            this.drugged = true;
            const rect = canvas.getBoundingClientRect();
            let x = (e.clientX - rect.left)/rect.width;
            let y = (e.clientY - rect.top)/rect.height;
            [x,y] = this.processInput(x,y);
            [x,y] = this.getMatrix(x,y);
            this.sectorsSelection.x1 = x;
            this.sectorsSelection.y1 = y;
            this.render();
        });
        canvas.addEventListener('pointerup', (e) => {
            if (this.chosenNotes.length==0){
                this.selectedToChosen();
            }
            const rect = canvas.getBoundingClientRect();
            let x = (e.clientX - rect.left)/rect.width;
            let y = (e.clientY - rect.top)/rect.height;
            [x,y] = this.processInput(x,y);
            [x,y] = this.getMatrix(x,y);
            this.sectorsSelection.x1 = x;
            this.sectorsSelection.y1 = y;
            this.drugged = false;
            this.render();
        });
        canvas.addEventListener('pointerleave', () => {
            this.sectorsSelection = {x1:-1, y1:-1, x2:-1, y2:-1}
            this.render();
        });

        this.render()
    }
    setScore(score:Score|null){
        if (score){
            this.score = score;
            this.canvas.style.display = 'block';
            this.render();
        } else {
            this.canvas.style.display = 'none';
        }
    }
    scroll(i:number){
        this.start_note -= i;
        if (this.start_note < 0) this.start_note = 0;
        if (this.start_note > this.max_note) this.start_note = this.max_note;
        if (this.drugged){
            for (let note of this.chosenNotes)
                this.move(note, this.sectorsSelection.x1, this.sectorsSelection.y1-i);
        }
        this.render();
    }
    copy(){
        this.buffer = [];
        for (let note of this.chosenNotes){
            this.buffer.push(note.clone());
        }
    }
    paste(){
        for (let note of this.buffer){
            this.score.notes.push(note.clone());
            this.score.sort();
            this.score.update();
            this.render();
        }
    }
    zoom(i:number){
        if (this.start_note >= this.max_note && this.start_note <= 0 && i==1) return;
        this.notes_width_count += i*2;
        console.log(this.start_note,this.max_note);
        if (this.start_note >= this.max_note){ 
            this.start_note -= i*2;
        } else if (this.start_note > 0) {
            this.start_note -= i
        }
        if (this.drugged){
            for (let note of this.chosenNotes)
                this.move(note, this.sectorsSelection.x1, this.sectorsSelection.y1-i);
        }
        this.max_note = 127 - this.notes_width_count;
        this.note_h = this.height/this.notes_width_count;
        this.render();
    }
    selectedToChosen(){
        this.chosenNotes = this.selectedNotes;
    }
    addSelectedToChosen(){
        for (let note of this.selectedNotes){
            if (!this.chosenNotes.includes(note)){
                this.chosenNotes.push(note);
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
        if (this.chosenNotes.length) {
            this.renderChosenNotes();
        }
        this.renderPianoLabels()
        if (!(this.sectorsSelection.x2==-1 || this.sectorsSelection.y2==-1 || (this.selectedNotes.length==1 && this.sectorsSelection.x1==this.sectorsSelection.x2 && this.sectorsSelection.y1==this.sectorsSelection.y2))){
            this.renderSector();
        } 
        
    }
    renderPiano(){
        let n = [1,3,6,8,10]
        for (let i = 0; i < this.notes_width_count; i++){
            if (!n.includes((i+this.start_note)%12)){
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
            this.ctx.strokeText(Note.numberToPitch(this.start_note+i), this.margin_left+5, -this.margin_top - i*this.note_h-this.note_h*0.2);
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
    renderNotes(){
        this.score.notes.forEach(note => {
            if (note.pitch < this.start_note || note.pitch > this.start_note + this.notes_width_count-1) return;
            this.ctx.beginPath();
            this.ctx.fillStyle = "red";
            this.ctx.fillRect(this.gridX + note.start*this.note_w, this.gridY-(note.pitch-this.start_note+1)*this.note_h, note.duration*this.note_w, this.note_h);
            this.ctx.strokeStyle = "white";
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(this.gridX + note.start*this.note_w, this.gridY-(note.pitch-this.start_note+1)*this.note_h, note.duration*this.note_w, this.note_h);
            this.ctx.closePath();
        });
    }
    renderSelected(){
        for (let note of this.selectedNotes){
            this.ctx.beginPath();
            this.ctx.strokeStyle = "yellow";
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(this.gridX + note.start*this.note_w, this.gridY-(note.pitch-this.start_note+1)*this.note_h, note.duration*this.note_w, this.note_h);
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
            this.ctx.lineWidth = 2;
            if (!n.includes((min+i+this.start_note)%12)){
                this.ctx.fillStyle = "yellow";
            } else {
                this.ctx.fillStyle = "rgb(240,160,0)";
            }
            this.ctx.fillRect(this.margin_left, this.gridY-(i+min+1)*this.note_h, this.pianoWidth*this.width, this.note_h);
            this.ctx.closePath();
        }
    }
    renderChosenNotes(){
        for (let note of this.chosenNotes){
            this.ctx.beginPath();
            this.ctx.strokeStyle = "blue";
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(this.gridX + note.start*this.note_w, this.gridY-(note.pitch-this.start_note+1)*this.note_h, note.duration*this.note_w, this.note_h);
            this.ctx.fillStyle = "blue";
            this.ctx.fillRect(this.margin_left, this.gridY-(note.pitch-this.start_note+1)*this.note_h, this.pianoWidth*this.width, this.note_h);
            
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
    doubleInput(x:number, y:number){
        if (this.selectedNotes.length) {
            this.score.removeNotes(this.chosenNotes);
            this.chosenNotes = [];
        } else {
            [x,y] = this.processInput(x, y);
            [x,y] = this.getMatrix(x, y);
            this.score.addNotes([new Note(y+this.start_note,x,1)]);
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
    move(note:Note, x:number, y:number){
        note.pitch = note.pitch-this.sectorsSelection.y1+y;
        note.start = note.start-this.sectorsSelection.x1+x;
    }
    moveDuration(note:Note, x:number){
        note.duration = x-this.selectedNotes[0].start+1;
    }
    moveStart(note:Note, x:number){
        note.duration = note.duration+this.sectorsSelection.x1-x;
        note.start = note.start-this.sectorsSelection.x1+x;
    }
    findNote(x:number, y:number, range:number, shift:boolean){
        [x,y] = this.processInput(x,y);;
        if (x >= 0 && x <= 1 && y >= 0 && y <= 1){
            let xn = x*this.score.duration;
            [x, y] = this.getMatrix(x, y);
            if (this.drugged){
                if (this.chosenNotes.length && this.selectedNotes.length){
                    if (shift){
                        if (this.selectedNotes[0].start<=xn && xn<=range+this.selectedNotes[0].start){
                            for (let note of this.chosenNotes)  
                                this.moveStart(note, Math.floor(xn-range/2));
                        } else if (this.selectedNotes[0].start+this.selectedNotes[0].duration>=xn && xn>=this.selectedNotes[0].start+this.selectedNotes[0].duration-range) {
                            for (let note of this.chosenNotes)
                                this.moveDuration(note, Math.floor(xn+range/2));
                        }
                    } else {
                        // if (ctrl){
                        //     this.score.addNotes(this.selectedNotes);
                        // }
                        for (let note of this.chosenNotes)
                            this.move(note, x, y);
                        
                    }
                    this.sectorsSelection.x1 = x;
                    this.sectorsSelection.y1 = y;
                    this.sectorsSelection.x2 = x;
                    this.sectorsSelection.y2 = y;
                    return;
                } else {
                    this.sectorsSelection.x2 = x;
                    this.sectorsSelection.y2 = y;
                }
            } else {
                this.sectorsSelection.x1 = x;
                this.sectorsSelection.y1 = y;
                this.sectorsSelection.x2 = x;
                this.sectorsSelection.y2 = y;
            }
        }
        this.selectedNotes = [];
        let x_min = Math.min(this.sectorsSelection.x1,this.sectorsSelection.x2); 
        let x_max = Math.max(this.sectorsSelection.x1, this.sectorsSelection.x2);
        let y_min = Math.min(this.sectorsSelection.y1,this.sectorsSelection.y2);
        let y_max = Math.max(this.sectorsSelection.y1, this.sectorsSelection.y2);
        for (let note of this.score.notes){
            if ((x_min <= note.start+note.duration-1 && note.start <= x_max) && (y_min<=note.pitch-this.start_note && y_max >= note.pitch-this.start_note)){
                this.selectedNotes.push(note);
            }
        }
    }
}