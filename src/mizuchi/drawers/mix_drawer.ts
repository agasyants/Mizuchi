import Mix from "../data/mix";
import Score from "../data/score";
import OscDrawer from "../drawers/osc_drawer";
import ScoreDrawer from "./score_drawer";
import Track from "../data/track";
import AudioEffect from "../classes/audio_effects";
import { TrackSelection, ScoreSelection} from "../classes/selection";
import CommandPattern, { Complex, Create, Delete, Move } from "../classes/CommandPattern";
import Drawer from "./Drawer";
import WindowController from "../classes/WindowController";


export default class MixDrawer extends Drawer{
    drugged:boolean = false;
    width:number=0;
    height:number=0;
    tracks_number_on_screen:number = 7;
    score_number_on_screen:number = 40;
    instrument_width:number = 0.1;
    track_h:number=0;
    score_h:number=0;
    score_w:number=0;
    len:number = 8;
    heights:number[] = [];

    y:number = 0;
    y_max:number=0;
    x:number = 0;
    x_max:number=0;

    ctrl:boolean = false;

    hovered:{scores:Score[],pos:number[],track:Track|null,start:boolean,end:boolean} = {scores:[], pos:[],track:null,start:false,end:false}
    
    sectorsSelection:{x1:number,y1:number,x2:number,y2:number} = {x1:-1, y1:-1, x2:-1, y2:-1}
    
    commandPattern:CommandPattern = new CommandPattern();

    tracks_min_max:number[][] = [];

    oscDrawer:OscDrawer;

    input_x:number = -1;
    input_y:number = -1;
    scores:ScoreSelection = new ScoreSelection();
    tracks:TrackSelection = new TrackSelection();
    constructor(public canvas:HTMLCanvasElement, public mix:Mix,  oscDrawer:OscDrawer, public score_window:WindowController, width:number, height:number)
    {
        super(canvas);
        this.oscDrawer = oscDrawer;
        this.setCanvasSize(width,height);
        this.calcMinMax();
        this.calcHeights();
        const drawer = this.score_window.drawer;
        if (drawer instanceof ScoreDrawer) drawer.update_mix = () => {
            this.calcMinMax();
            this.render();
        };
        this.canvas.focus();

        canvas.onselectstart = function () { return false; }
        canvas.tabIndex = 0;

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY){
                const y = e.deltaY;
                if (e.ctrlKey){
                    const [x,] = this.processInput(this.input_x, this.input_y);
                    const delta_size = x * this.width * 0.1;
                    console.log(delta_size,this.score_number_on_screen);
                    if (y/Math.abs(y)>0){
                        this.score_number_on_screen *= 1.1;
                        this.x-=delta_size;
                    } else {
                        this.score_number_on_screen *= 0.9;
                        this.x+=delta_size;
                    }
                    console.log(delta_size,this.score_number_on_screen);
                    // this.x -= y;
                    // if (this.x > this.x_max) this.x = this.x_max;
                    if (this.x < 0) this.x = 0;
                    this.score_number_on_screen = Math.max(this.score_number_on_screen,2);
                    this.score_w = this.width/this.score_number_on_screen;
                    this.calcMaxes();
                } else if (e.shiftKey){
                    this.x += y;
                    this.y += e.deltaX;
                } else {
                    this.y += y;
                    this.x += e.deltaX;
                }
                // if (this.x > this.x_max) this.x = this.x_max;
                if (this.x < 0) this.x = 0;
                if (this.y > this.y_max) this.y = this.y_max;
                if (this.y < 0) this.y = 0;
                this.hitScan();
                this.render();                
            }
        });
        canvas.addEventListener('pointermove', (e) => {
            const rect = canvas.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            this.input_x = x * devicePixelRatio;
            this.input_y = y * devicePixelRatio;
            if (this.hitScan(e.altKey, e.shiftKey)){
                this.render();
            }
        });
        canvas.addEventListener('dblclick', () => {
            this.doubleInput(this.input_x, this.input_y);
        });
        canvas.addEventListener('keydown', (e) => {
            if (e.code=="ControlLeft"){
                this.ctrl = true;
            }
            if (e.code!="KeyS" && e.code!="KeyI" && e.code!="Space"){
                e.stopPropagation();
            }
            if (e.code=="KeyA" && e.ctrlKey){
                e.preventDefault();
            }
            if (e.code=="Delete" || e.code=="Backspace"){
                if (this.scores.elements.length){  // delete elements scores
                    let commands = [];
                    for (let i = 0; i < this.scores.elements.length; i++){
                        commands.push(new Delete(this.mix, this.scores.elements[i]));
                        this.scores.track_index.splice(i, 1);
                    }
                    this.commandPattern.addCommand(new Complex(commands));
                    this.scores.elements = [];          
                } 
                else if (this.tracks.elements.length){ // delete elements tracks
                    let commands = [];
                    for (let i = 0; i < this.tracks.elements.length; i++){
                        commands.push(new Delete(this.mix, this.tracks.elements[i]));
                        this.tracks.index.splice(i, 1);
                    }
                    this.commandPattern.addCommand(new Complex(commands));
                    this.tracks.elements = [];
                    this.calcHeights();
                }
                this.calcMaxes();
            }
            if (e.code=="KeyZ" && e.ctrlKey){
                if (e.shiftKey){
                    this.commandPattern.redo();
                } else {
                    this.commandPattern.undo();
                } this.calcHeights();
            }
            this.calcMinMax();
            this.hitScan();
            this.render();
        });
        canvas.addEventListener('keyup', (e) => {
            if (e.code=="ControlLeft"){
                this.ctrl = false;
            }
        });
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        })
        canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (e.button==0) {
                this.canvas.setPointerCapture(e.pointerId);
                this.drugged = true;
                if (this.hovered.track){ // select track
                    if (this.w-this.margin_left > this.x && this.input_x > (this.margin_left+this.width)){
                        if (!e.shiftKey){
                            this.tracks.elements = [];
                            this.tracks.index = [];
                        }
                        this.tracks.elements.push(this.hovered.track);
                        this.tracks.index.push(this.mix.tracks.indexOf(this.hovered.track));
                        this.oscDrawer.oscFunction = this.hovered.track.inst.osc.oscFunction;
                    }
                } 
                if (this.hovered.scores.length) { // select score
                    if (e.shiftKey) {
                        this.addSelectedToChosen();
                    } else {
                        let f = false;
                        for (let score of this.scores.elements) {
                            if (score == this.hovered.scores[0]) f = true;
                        }
                        if (!f) this.selectedToChosen();
                    }
                    let [x, y] = this.processInput(this.input_x, this.input_y);
                    [x,y] = this.getMatrix(x,y);
                    this.scores.drugged_x = x;
                    this.scores.drugged_y = y;
                    const drawer = this.score_window.drawer;
                    if (drawer instanceof ScoreDrawer) {
                        if (drawer.canvas.style.display=='block'){
                            drawer.controller.setScore(this.scores.getLast());
                        }
                    }
                } else {
                    if (!e.shiftKey) this.scores.elements = [];
                    this.score_window.close();
                }
            }
            this.render();
        });
        canvas.addEventListener('pointerup', (e) => {
            this.canvas.releasePointerCapture(e.pointerId);
            this.drugged = false;
            let ss = this.sectorsSelection;
            if (e.shiftKey && (ss.x2-ss.x1) && (ss.y2-ss.y1)){
                this.addSelectedToChosen();
                this.hovered.scores = [];
            } else if (this.scores.elements.length==0) {
                this.selectedToChosen();
                this.hovered.scores = [];
            } else {
                this.applyChanges();
            }
            if (this.scores.end-this.scores.start){
                this.mix.start = this.scores.start/2;
            } else {
                this.mix.start = this.sectorsSelection.x1*4;
            }
            this.hitScan();
            this.render();
        });
        canvas.addEventListener('pointerleave', () => {
            if (this.hitScan()) this.render();
        });
        canvas.addEventListener('pointerover', () => {
            if (this.score_window.drawer.canvas.style.display=='none'){
                this.canvas.focus();
            }
        });
        this.render()
    }
    setCanvasSize(width: number, height: number): void {
        super.setCanvasSize(width, height, 30);
        // this.canvas.style.width = width + 'px';
        // this.canvas.style.height = height + 'px';
        this.width = (1-this.instrument_width)*this.w - 2*this.margin_left;
        this.height = (this.h - 2*this.margin_top);
        this.track_h = this.height/this.tracks_number_on_screen
        this.score_h = this.track_h;
        this.score_w = this.width/this.score_number_on_screen;
        this.calcMaxes();
    }
    selectedToChosen(){
        this.scores.elements = this.hovered.scores;
        this.scores.track_index = this.hovered.pos;
        if (this.sectorsSelection.x1!=-1){
            this.scores.start = this.sectorsSelection.x1*this.len;
            this.scores.end = (this.sectorsSelection.x2+1)*this.len;
        } else {
            this.scores.start = this.hovered.scores[0].start_time;
            this.scores.end = this.hovered.scores[0].start_time+this.hovered.scores[0].duration;
        }
        for (let score of this.scores.elements){
            this.scores.start = Math.min(this.scores.start, score.start_time);
            this.scores.end = Math.max(this.scores.end, score.start_time + score.duration);
        }
    }
    addSelectedToChosen(){
        const s = this.scores;
        if (this.sectorsSelection.x1!=-1){
            s.start = Math.min(s.start, this.sectorsSelection.x1);
            s.end = Math.max(s.end, this.sectorsSelection.x2+1);
        }
        // if (this.hovered.scores.length){
        //     this.scores.elements = this.scores.elements.concat(this.hovered.scores)
        // }
        for (let i = 0; i < this.hovered.scores.length; i++){
            const score = this.hovered.scores[i];
            if (s.elements.includes(score)) {  
                const index = s.elements.indexOf(score);
                s.elements.splice(index, 1);
                s.track_index.splice(index, 1);
                s.start = Math.min(s.start, score.start_time);
                s.end = Math.max(s.end, score.start_time+score.duration);
            } else {
                s.start = Math.min(s.start, score.start_time);
                s.end = Math.max(s.end, score.start_time + score.duration);
                s.elements.push(score);
                s.track_index.push(this.hovered.pos[i]);
            }
        }
    }
    applyChanges(){
        if (this.scores.offset.start || this.scores.offset.pitch || this.scores.offset.duration){
            let commands = [];
            if (this.ctrl){
                for (let i = 0; i < this.scores.elements.length; i++){
                    commands.push(new Create(this.mix, this.scores.elements[i].clone(), this.scores.track_index[i]));
                }
            }
            console.log(this.scores);
            
            commands.push(new Move(this.mix, this.scores, [this.scores.offset.start, this.scores.offset.duration, this.scores.offset.pitch]));
            this.commandPattern.addCommand(new Complex(commands));
            this.calcMinMax();
            this.scores.clear();
        }
    }
    calcHeights(){
        let h = 0;
        this.heights = [];
        for (let track of this.mix.tracks){
            this.heights.push(h);
            h+=track.renderHeight;
        }
        console.log(this.heights);
    }
    calcMaxes(){
        this.y_max = (this.mix.tracks.length-this.tracks_number_on_screen+2)*this.track_h;
        if (this.y_max<0) this.y_max = 0;
        this.x_max = (this.mix.tracks[0].scores.length*4-this.score_number_on_screen+6)*this.score_w;
        if (this.x_max<0) this.x_max = 0;
    }
    calcMinMax(){
        this.tracks_min_max = [];
        for (let track of this.mix.tracks){
            let min = 127;
            let max = 0;
            for (let score of track.scores){
                for (let note of score.notes){
                    min = Math.min(min, note.pitch);
                    max = Math.max(max, note.pitch);
                }
            }
            this.tracks_min_max.push([min, max]);
        }
    }
    render() {
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.ctx.font = "16px system-ui";
        this.renderBack();
        let h = 0;
        for (let i = 0; i < this.mix.tracks.length; i++){
            for (let score of this.mix.tracks[i].scores){
                if (this.scores.elements.includes(score)){
                    this.renderScore(i, score,'rgba(255,255,255,0.3)','rgba(255,255,255,0.4)');
                } else {
                    this.renderScore(i, score);
                }
            }
            this.renderTrack(h,this.mix.tracks[i].renderHeight);
            h += this.mix.tracks[i].renderHeight;
        }
        if (!(this.drugged && this.hovered.scores.length==1 && this.scores.elements.includes(this.hovered.scores[0]))) this.renderHovered();
        this.renderSelected();
        this.renderMovedScores();
        this.renderTime();
        this.renderFrame();
        this.renderSelection();
        if (this.hovered.track && !(this.sectorsSelection.x1==-1) && !(this.drugged && this.hovered.scores.length==1 && this.scores.elements.includes(this.hovered.scores[0]))) this.renderSector();
    }
    renderBack(){
        for (let j = 0; j < this.score_number_on_screen; j++){
            let x = j*this.score_w - (this.x)%this.score_w + this.margin_left;
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.margin_top);
            this.ctx.lineTo(x, this.margin_top+this.height);
            this.ctx.strokeStyle = 'rgba(225,225,255,0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            this.ctx.closePath();
        }
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(this.margin_left, this.margin_top, this.width, this.height);
        this.ctx.strokeRect(this.margin_left+this.width, this.margin_top, this.w*this.instrument_width, this.height);
    }
    renderTime(){
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'yellow';
        this.ctx.lineWidth = 3;
        let x = this.margin_left+this.mix.start*this.score_w/4-this.x;
        this.ctx.moveTo(x, this.margin_top);
        this.ctx.lineTo(x, this.margin_top+this.height);
        this.ctx.stroke();
        this.ctx.closePath();
    }
    renderFrame(){
        this.ctx.beginPath();
        this.ctx.moveTo(this.margin_left, this.margin_top);
        this.ctx.lineTo(this.margin_left, this.h-this.margin_top);
        this.ctx.lineTo(this.w-this.margin_left, this.h-this.margin_top);
        this.ctx.lineTo(this.w-this.margin_left, this.margin_top);
        this.ctx.lineTo(this.margin_left, this.margin_top);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(this.w, 0);
        this.ctx.lineTo(this.w, this.h);
        this.ctx.lineTo(0, this.h);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(this.margin_left, this.margin_top);
        this.ctx.fillStyle = 'black';
        this.ctx.fill();
        this.ctx.closePath();
    }
    renderTrack(i:number,h:number){
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.margin_left, this.margin_top+i*this.track_h-this.y, this.width, this.track_h*h);
        this.ctx.stroke();
        this.ctx.closePath();
        this.renderInst(i,'black','white');
    }
    renderInst(i:number, fillColor:string, strokeColor:string){
        let inst_left = (1-this.instrument_width)*this.w-this.margin_left;
        let y = this.margin_top-this.y;
        this.ctx.fillStyle = fillColor;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.beginPath();
        this.ctx.fillRect(inst_left, i*this.track_h+y, this.instrument_width*this.w, this.track_h);
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(inst_left, i*this.track_h+y, this.instrument_width*this.w, this.track_h);
        this.ctx.fillStyle = 'white';
        this.ctx.fillText((i+1)+" "+this.mix.tracks[i].name, this.margin_left+inst_left-16, i*this.track_h+y+26);
        this.ctx.closePath();
    }
    renderScore(i:number, score:Score, strokeColor:string='white', fillColor:string='white', lineWidth:number=2, drug:boolean=false) {
        let start = score.start_time;
        let duration = score.duration;
        let height = this.heights[i];
        if (drug){
            start += this.scores.offset.start;
            duration += this.scores.offset.duration;
            height = this.heights[i+this.scores.offset.pitch];
        }
        const start_x = this.margin_left + this.score_w*start/this.len-this.x;
        const dur_x = this.score_w*duration/this.len;
        const start_y = this.margin_top + height*this.score_h-this.y;
            
        this.ctx.beginPath();
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.fillStyle = fillColor;
        this.ctx.strokeRect(start_x, start_y, dur_x, this.mix.tracks[i].renderHeight*this.score_h);

        const m = this.tracks_min_max[i][0]-3;
        const M = this.tracks_min_max[i][1]+2;
        const nh = this.score_h/(M-m)-1;
        const k = this.score_w/score.duration*4;
        for (let note of score.notes){
            const y = start_y + this.score_h*(1-(note.pitch-m)/(M-m));
            this.ctx.fillRect(start_x+note.start*k, y, note.duration*k, nh);
        }
        this.ctx.closePath();
    }
    renderSector(){
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(255,255,0,0.8)';
        this.ctx.lineWidth = 2;
        const x_min = Math.min(this.sectorsSelection.x1,this.sectorsSelection.x2); 
        const x_len = Math.max(this.sectorsSelection.x1, this.sectorsSelection.x2)-x_min+1;
        const y_min = Math.min(this.sectorsSelection.y1,this.sectorsSelection.y2);
        const y_len = Math.max(this.sectorsSelection.y1, this.sectorsSelection.y2)-y_min+1;
        const x = this.margin_left + x_min*this.score_w-this.x;
        const y = this.margin_top + y_min*this.score_h-this.y;
        const w = x_len*this.score_w;
        const h = y_len*this.score_h;
        this.ctx.beginPath();
        this.ctx.strokeStyle = "yellow";
        this.ctx.lineWidth = 2;
        this.ctx.fillStyle = 'rgba(255,255,0,0.1)'
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeRect(x, y, w, h);
        this.ctx.closePath();
    }
    renderHovered(){
        if (this.hovered.track){
            const i = this.mix.tracks.indexOf(this.hovered.track);
            const y = this.margin_top + i*this.track_h-this.y;
            this.ctx.beginPath();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fillRect(this.margin_left+this.width, y, this.w*this.instrument_width, this.track_h);
            this.ctx.closePath();
        }
        if (this.hovered.scores.length && this.hovered.track){
            for (let i = 0; i < this.hovered.scores.length; i++){
                this.renderScore(this.hovered.pos[i], this.hovered.scores[i],'yellow','yellow', 3);
            }
        }
    }
    renderSelected(){
        if (!this.drugged){
            for (let i = 0; i < this.scores.elements.length; i++){
                this.renderScore(this.scores.track_index[i], this.scores.elements[i],'blue','blue',3);
            }
        }
        if (this.tracks.elements.length){
            for (let i = 0; i < this.tracks.elements.length; i++){
                this.renderInst(this.tracks.index[i],'black','yellow');
            }
        }
    }
    private renderMovedScores(){        
        if (this.scores.isShifted() || this.drugged){
            for (let i = 0; i < this.scores.elements.length; i++){
                this.renderScore(this.scores.track_index[i], this.scores.elements[i], 'blue', 'blue', 3, true);
            }
        }
    }
    private renderSelection(){
        this.ctx.beginPath();
        this.ctx.fillStyle = "yellow";
        const sel = this.scores;
        this.ctx.fillRect(this.margin_left+sel.start*this.score_w/this.len, this.margin_top-5, (sel.end-sel.start)*this.score_w/this.len,-4);
        this.ctx.closePath();
    }

    doubleInput(x:number, y:number){
        if (x >= this.margin_left && x <= this.w-this.margin_left && y >= this.margin_top && y <= this.h-this.margin_top){
            if (!this.hovered.track) {
                this.commandPattern.addCommand(new Create(this.mix, new Track('track'), this.mix.tracks.length));
                this.calcMaxes();
                this.calcHeights();
                this.render();
            } else if (this.scores.elements.length) {
                const drawer = this.score_window.drawer;
                if (drawer instanceof ScoreDrawer) {
                    if (drawer.canvas.style.display=='block') {
                        this.score_window.close();
                    } else {
                        drawer.controller.setScore(this.scores.getLast());
                        this.score_window.open();
                    }
                }
            } else {
                this.commandPattern.addCommand(new Create(this.mix, new Score(this.mix.start*2), this.mix.tracks.indexOf(this.hovered.track)));
                this.calcMaxes();
                this.render();
            }
            if (this.hitScan()){
                this.render();
            }
        }
    }
    getMatrix(x:number,y:number){
        return [Math.floor((x+this.x/this.width)*this.score_number_on_screen), Math.floor((y+this.y/this.height)*this.tracks_number_on_screen)];
    }
    processInput(x:number, y:number){
        x = (x - this.margin_left)/this.width;
        y = (y - this.margin_top)/this.height;
        return [x,y];
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
        if (this.scores.elements.length && this.hovered.scores.length && !shift){
            let s = this.scores;
            // let str = this.hovered.scores[0].score.start_time % 1;
            // let dur = (this.hovered.note.start + this.hovered.note.duration) % 1;
            // if (this.hovered.start && !ctrl) {
            //     s.offset_start = x - this.round(s.drugged_x, shift) - str;
            //     s.offset_duration = this.round(s.drugged_x, shift) - x + str;
            // } else if (this.hovered.end && !ctrl) {
            //     s.offset_duration = this.round(x - s.drugged_x, shift) - dur;
            // } else {
            //     console.log(x, s.drugged_x, s.offset_start)
                s.offset.start = (x - s.drugged_x)*this.len;
                if (s.offset.start+s.start<0) {
                    s.offset.start=-s.start;
                }
                s.offset.pitch = y - s.drugged_y;
            // }
            if (alt) {
                x = Math.round(x+0.5)
            }
            this.setSS1(x, y);
            this.setSS2(x, y);
        } 
        // else if (this.tracks.elements.length && this.hovered.track) {
        //     console.log('bbb');

        // } 
        else {
            this.setSS2(x, y);
            this.select();
        }
    }
    select(){
        this.hovered.scores = [];
        this.hovered.pos = [];
        const ss = this.sectorsSelection;
        const x_min = Math.min(ss.x1, ss.x2) * this.len; 
        const x_max = Math.max(ss.x1, ss.x2) * this.len;
        const y_min = Math.min(ss.y1,ss.y2);
        const y_max = Math.max(ss.y1, ss.y2);
        for (let i=0; i < this.mix.tracks.length; i++){
            for (let score of this.mix.tracks[i].scores){
                if ((x_min <= score.start_time+score.duration-1 && score.start_time <= x_max) && (y_min<=i && y_max >= i)){
                    this.hovered.scores.push(score);
                    this.hovered.pos.push(i)
                }
            }
        }
    }
    setSS1(x:number, y:number){
        this.sectorsSelection.x1 = x;
        this.sectorsSelection.y1 = y;
    }
    setSS2(x:number, y:number){
        this.sectorsSelection.x2 = x;
        this.sectorsSelection.y2 = y;
    }
    hitScan(alt:boolean=false,shift:boolean=false):boolean{
        let x = this.input_x;
        let y = this.input_y;
        [x, y] = this.processInput(x, y);
        if (x<0) x=0;
        if (x>1) x=0.99;
        if (y<0) y=0;
        if (y>1) y=0.99;
        
        [x,y] = this.getMatrix(x,y);
        if (this.drugged) {
            this.drug(x, y, alt, shift);
            return true;
        }
        let h = 0;
        for (let i = 0; i < this.mix.tracks.length; i++){
            if (y == h){
                this.hovered.track = this.mix.tracks[i];
                if (x-this.x < this.score_number_on_screen) {
                    for (let score of this.mix.tracks[i].scores) {
                        let start_x = score.start_time;
                        if (x*8 >= start_x && x*8 < start_x+score.duration){
                            this.hovered.scores = [score];
                            this.hovered.pos = [i];
                            this.zero();
                            return true;
                        }
                    } 
                    this.hovered.scores = [];
                    this.setSS1(x, y);
                    this.setSS2(x, y);
                    return true;
                }
                this.zero();
                return true;
            } 
            h += this.mix.tracks[i].renderHeight;
        } 
        this.hovered.scores = [];
        this.setSS1(x, y);
        this.setSS2(x, y);
        let result = false;
        if (this.hovered.scores.length || this.hovered.track) result = true;
        this.hovered.scores = [];
        this.hovered.track = null;
        return result;
    }
    zero(){
        this.sectorsSelection.x1 = -1;
        this.sectorsSelection.y1 = -1;
        this.sectorsSelection.x2 = -1;
        this.sectorsSelection.y2 = -1;
    }
    addAudioEffect(effect:AudioEffect){
        for (let track of this.tracks.elements){
            track.audioEffects.push(effect);
        }
    }
} 