import Mix from "../data/mix";
import Score from "../data/score";
import ScoreDrawer from "./score_drawer";
// import Track from "../data/track";
// import {TrackSelection, ScoreSelection} from "../classes/selection";
import Drawer from "./Drawer";
import WindowController from "../classes/WindowController";
import MixController from "./mix_controller";
import { HoveredMix } from "../classes/hovered";
import SectorSelection from "../classes/SectorSelection";
import NodeSpaceDrawer from "./node_space_drawer";
import BloomShader from "../classes/BloomShader";

export default class MixDrawer extends Drawer {
    show_id:boolean = true;

    drugged:boolean = false;
    width:number=0;
    height:number=0;
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
    
    slicerMode:boolean = true;

    hovered: HoveredMix = new HoveredMix();
    
    tracks_min_max:number[][] = [];
    sectorsSelection:SectorSelection = new SectorSelection();

    input_x:number = -1;
    input_y:number = -1;

    controller:MixController;

    constructor(
        public canvas:HTMLCanvasElement, 
        public mix:Mix,
        public score_window:WindowController,
        public node_window:WindowController, 
        width:number, 
        height:number,
         _bloomShader: BloomShader
        ){
        super(canvas, _bloomShader);
        this.controller = new MixController(mix, mix.commandPattern, this, this.hovered, this.sectorsSelection, score_window)
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
                    // console.log(delta_size,this.score_number_on_screen);
                    if (y/Math.abs(y)>0){
                        this.score_number_on_screen *= 1.1;
                        this.x -= delta_size;
                    } else {
                        this.score_number_on_screen *= 0.9;
                        this.x += delta_size;
                    }
                    // console.log(delta_size,this.score_number_on_screen);
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
                this.hitScan();
                this.render();
            }
        });
        canvas.addEventListener('dblclick', () => {
            if (this.input_x >= this.margin_left && this.input_x <= this.w-this.margin_left && this.input_y >= this.margin_top && this.input_y <= this.h-this.margin_top)
                this.controller.doubleInput();
        });
        canvas.addEventListener('keydown', (e) => {
            if (e.code=="ControlLeft"){
                this.controller.ctrl = true;
            }
            if (e.code=="KeyQ"){
                this.slicerMode = !this.slicerMode;
            }
            if (e.code!="KeyS" && e.code!="KeyI" && e.code!="Space"){
                e.stopPropagation();
                e.preventDefault();
            }
            if (e.code=="KeyJ" && e.ctrlKey){
                if (this.mix.selected.scores.elements.length)
                    this.controller.concatScores();
            }
            if (e.code=="KeyA" && e.ctrlKey){
                this.controller.selectAll(e.shiftKey);
            }
            if (e.code=="KeyD" && e.ctrlKey){
                this.controller.dublicate();
            }
            if (e.code=="Delete" || e.code=="Backspace"){
                this.controller.deleteSelected();
            }
            if (e.code=="KeyZ" && e.ctrlKey){
                if (e.shiftKey){
                    this.controller.commandPattern.redo();
                } else {
                    this.controller.commandPattern.undo();
                } this.calcHeights();
            }
            this.calcMinMax();
            this.hitScan();
            this.render();
        });
        canvas.addEventListener('keyup', (e) => {
            if (e.code=="ControlLeft"){
                this.controller.ctrl = false;
                this.hitScan();
                this.render();
            }
        });
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        })
        canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (e.button==0){
                this.canvas.setPointerCapture(e.pointerId);
                this.drugged = true;
                if (this.hovered.track){ // select track
                    if (this.w-this.margin_left > this.x && this.input_x > (this.margin_left + this.width)){
                        if (!e.shiftKey && this.mix.selected.tracks.elements.length) {
                            this.mix.select(this.mix.selected.tracks.elements,this.sectorsSelection.x1,this.sectorsSelection.x2);
                        }
                        this.mix.select([this.hovered.track],this.sectorsSelection.x1,this.sectorsSelection.x2);
                        if (this.node_window.drawer instanceof NodeSpaceDrawer){
                            this.node_window.drawer.nodeSpace = this.hovered.track.nodeSpace;
                        }
                        this.node_window.open();
                    }
                } 
                if (this.hovered.scores.length) { // select score
                    if (e.shiftKey) {
                        this.mix.select(this.hovered.scores.slice(),this.sectorsSelection.x1,this.sectorsSelection.x2);
                    } else {
                        let f = false;
                        for (let score of this.mix.selected.scores.elements) {
                            if (score == this.hovered.scores[0]) f = true;
                        }
                        if (!f) {
                            if (this.mix.selected.scores.elements.length) {
                                this.mix.select(this.mix.selected.scores.elements.slice(),this.sectorsSelection.x1,this.sectorsSelection.x2);
                                this.mix.select(this.hovered.scores.slice(),this.sectorsSelection.x1,this.sectorsSelection.x2);
                            } else {
                                this.mix.select(this.hovered.scores.slice(),this.sectorsSelection.x1, this.sectorsSelection.x2);
                            }
                        }
                    }
                    let [x, y] = this.processInput(this.input_x, this.input_y);
                    [x,y] = this.getMatrix(x,y);
                    x = Math.floor(x);
                    y = Math.floor(y);
                    this.mix.selected.scores.drugged_x = x;
                    this.mix.selected.scores.drugged_y = y;
                    const drawer = this.score_window.drawer;
                    if (drawer instanceof ScoreDrawer) {
                        if (drawer.canvas.style.display=='block'){
                            drawer.controller.setScore(this.mix.selected.scores.getLast());
                        }
                    }
                } else {
                    if (!e.shiftKey) {
                        this.mix.select(this.mix.selected.scores.elements.slice(), this.sectorsSelection.x1, this.sectorsSelection.x2);
                        // this.mix.selected.scores.elements = [];
                    }
                    this.score_window.close();
                }
            }
            return;
            this.render();
        });
        canvas.addEventListener('pointerup', (e) => {
            this.canvas.releasePointerCapture(e.pointerId);
            this.drugged = false;
            let ss = this.sectorsSelection;
            if (e.shiftKey && (ss.x2-ss.x1) && (ss.y2-ss.y1)){
                this.mix.select(this.hovered.scores,this.sectorsSelection.x1,this.sectorsSelection.x2);
                this.hovered.scores = [];
            } else if (this.mix.selected.scores.elements.length == 0) {
                this.mix.select(this.hovered.scores,this.sectorsSelection.x1,this.sectorsSelection.x2);
                this.hovered.scores = [];
            } else {
                this.controller.applyChanges();
            }
            if (this.mix.selected.scores.end-this.mix.selected.scores.start){
                this.mix.start = this.mix.selected.scores.start/2;
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
        this.width = (1-this.instrument_width)*this.w - 2*this.margin_left;
        this.height = (this.h - 2*this.margin_top);
        this.track_h = this.height/this.mix.tracks_number_on_screen
        this.score_h = this.track_h;
        this.score_w = this.width/this.score_number_on_screen;
        this.calcMaxes();
    }
        calcHeights(){
            let h = 0;
            this.heights = [];
            for (let track of this.mix.tracks){
                this.heights.push(h);
                h+=track.renderHeight;
            }
            this.heights.push(h);
            // console.log(this.heights);
        }
        calcMaxes(){
            this.y_max = (this.mix.tracks.length-this.mix.tracks_number_on_screen+2)*this.track_h;
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
                } this.tracks_min_max.push([min, max]);
            }
        }
    _render(){
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.ctx.font = "16px system-ui";
        this.renderBack();
        
        let h = 0;
        for (let i = 0; i < this.mix.tracks.length; i++){
            for (let score of this.mix.tracks[i].scores){
                if (this.mix.selected.scores.elements.includes(score)){
                    this.renderScore(i, score,'rgba(255,255,255,0.3)','rgba(255,255,255,0.4)');
                } else {
                    this.renderScore(i, score);
                }
            }
            
            this.renderTrack(h,this.mix.tracks[i].renderHeight);
            h += this.mix.tracks[i].renderHeight;
        }

        if (!(this.drugged && this.hovered.scores.length==1 && this.mix.selected.scores.elements.includes(this.hovered.scores[0]))){
            this.renderHovered()
        };
        
        this.renderSelected();
        this.renderMovedScores();
        this.renderFrame();
        this.renderSelection();
        if (this.hovered.track && !(this.sectorsSelection.x1==-1) && !(this.drugged && this.hovered.scores.length==1 && this.mix.selected.scores.elements.includes(this.hovered.scores[0]))) {
            if (!this.hovered.scores.length || this.drugged)
                this.renderSector();
        }
        for (let i = 0; i < this.mix.tracks.length; i++){
            this.renderInst(i,'black','white');
        }
        const tracks = this.mix.selected.tracks;
        if (tracks.elements.length){
            for (let i = 0; i < tracks.elements.length; i++)
                this.renderInst(tracks.index[i],'black','yellow');
        } 
        if (this.hovered.start || this.hovered.end){
            this.renderHoveredStartEnd();
        }
        this.renderTime();
    }
    private renderBack(){
        const y = this.heights[this.heights.length-1]*this.score_h-this.y;
        for (let j = 0; j < this.score_number_on_screen; j++){
            let x = j*this.score_w - (this.x)%this.score_w + this.margin_left;
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.margin_top);
            this.ctx.lineTo(x, this.margin_top+y);
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
    private renderTime(){
        const x1 = this.margin_left + this.mix.start*this.score_w/4 - this.x;
        const x2 = this.margin_left + this.mix.playback/(this.mix.sampleRate/this.mix.bpm*120)*this.score_w - this.x;

        this.ctx.beginPath();
        this.ctx.strokeStyle = 'blue';
        this.ctx.lineWidth = 2;
        this.ctx.moveTo(x2, this.margin_top+this.height);
        this.ctx.lineTo(x2, this.margin_top-20);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.strokeStyle = 'yellow';
        this.ctx.lineWidth = 3;
        this.ctx.moveTo(x1, this.margin_top);
        this.ctx.lineTo(x1, this.margin_top-20);
        this.ctx.stroke();
        this.ctx.closePath();
    }
    private renderFrame(){
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
    private renderTrack(i:number,h:number){
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.margin_left, this.margin_top+i*this.track_h-this.y, this.width, this.track_h*h);
        this.ctx.stroke();
        this.ctx.closePath();
    }
    private renderInst(i:number, fillColor:string, strokeColor:string){
        const inst_left = (1-this.instrument_width)*this.w-this.margin_left;
        const y = this.margin_top-this.y;
        this.ctx.fillStyle = fillColor;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.beginPath();
        this.ctx.fillRect(inst_left, i*this.track_h+y, this.instrument_width*this.w, this.track_h);
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(inst_left, i*this.track_h+y, this.instrument_width*this.w, this.track_h);
        this.ctx.fillStyle = 'white';
        this.ctx.fillText((i+1)+" "+this.mix.tracks[i].name, this.margin_left+inst_left-16, i*this.track_h+y+26);

        if (this.show_id) this.ctx.fillText(this.mix.tracks[i].id.toString(), this.margin_left+inst_left-16, i*this.track_h+y+50)

        this.ctx.closePath();
    }
    private renderScore(i:number, score:Score, strokeColor:string = 'white', fillColor:string = 'white', lineWidth:number=2, drug:boolean=false) {
        let start = score.absolute_start;
        let duration = score.duration;
        let loop = score.loop_duration;
        let height = this.heights[i];
        let rel = (score.relative_start+loop) % loop;
        
        if (drug){
            start += this.mix.selected.scores.offset.start;
            duration += this.mix.selected.scores.offset.duration;
            loop += this.mix.selected.scores.offset.loop_duration;
            height = this.heights[i+this.mix.selected.scores.offset.pitch];
            rel = (rel + this.mix.selected.scores.offset.rel + loop) % loop;
        }
        let start_x = this.margin_left + this.score_w*start/this.len-this.x;
        const dur_x = this.score_w*duration/this.len;
        const start_y = this.margin_top + height*this.score_h-this.y;
        const dur_y = this.mix.tracks[i].renderHeight*this.score_h;
            
        this.ctx.beginPath();
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.fillStyle = fillColor;
        
        if (this.show_id) this.ctx.fillText(score.id.toString(), start_x+10, start_y+30)

        this.ctx.strokeRect(start_x, start_y, dur_x, dur_y);
        start_x -= this.score_w/this.len*rel;

        const m = this.tracks_min_max[i][0]-3;
        const M = this.tracks_min_max[i][1]+2;
        const nh = this.score_h/(M-m)-1;
        const k = this.score_w/8;
        
        let sx = start_x;
        // if (this.mix.selected.scores.elements.includes(score))
        //     console.log(rel, Math.ceil((duration+rel)/loop)-1);
        for (let j = 0; j < Math.ceil(duration/loop); j++){
            for (let note of score.notes) {
                if (note.start >= score.loop_duration) continue;
                const y = start_y + this.score_h*(1-(note.pitch-m)/(M-m));
                if (note.start < rel && note.start + (j+1)*loop - rel < duration) {
                    this.ctx.fillRect(start_x + note.start*k + loop*this.score_w/this.len, y, note.duration*k, nh);
                } else if (note.start + j*loop - rel < duration && (duration > loop || note.start >= rel)) {
                    this.ctx.fillRect(start_x + note.start*k, y, note.duration*k, nh);
                }
            }
            start_x += loop*this.score_w/this.len;
        }
        for (let j = 0; j < Math.ceil((duration+rel)/loop)-1; j++){
            sx += loop*this.score_w/this.len;   
            this.ctx.moveTo(sx, start_y);
            this.ctx.lineTo(sx, start_y + 20);
            this.ctx.moveTo(sx, start_y + dur_y);
            this.ctx.lineTo(sx, start_y + dur_y-20);
            this.ctx.stroke();
        }
        this.ctx.closePath();
    }
    private renderSector(){
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(255,255,0,0.8)';
        this.ctx.lineWidth = 2;
        const x_min = Math.min(this.sectorsSelection.x1,this.sectorsSelection.x2); 
        const x_len = Math.max(this.sectorsSelection.x1, this.sectorsSelection.x2)-x_min+1;
        const y_min = Math.min(this.sectorsSelection.y1,this.sectorsSelection.y2);
        const y_len = Math.max(this.sectorsSelection.y1, this.sectorsSelection.y2)-y_min+1;
        const x = this.margin_left + x_min*this.score_w-this.x;
        const y = this.margin_top + y_min*this.score_h-this.y;
        let w;
        if (this.slicerMode){
            w = (x_len-1)*this.score_w;
        } else {
            w = x_len*this.score_w;
        }
        const h = y_len*this.score_h;
        this.ctx.beginPath();
        this.ctx.strokeStyle = "yellow";
        this.ctx.lineWidth = 2;
        this.ctx.fillStyle = 'rgba(255,255,0,0.1)'
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeRect(x, y, w, h);
        this.ctx.closePath();
    }
    private renderHovered(){
        if (this.hovered.scores.length && this.hovered.track){
            for (let i = 0; i < this.hovered.scores.length; i++){
                this.renderScore(this.hovered.pos[i], this.hovered.scores[i],'yellow','yellow', 3);
            }
        }
    }
    private renderSelected(){
        if (!this.drugged){
            const scores = this.mix.selected.scores;
            for (let i = 0; i < scores.elements.length; i++){
                if (scores.elements[i].parent) {
                    this.renderScore(scores.track_index[i], scores.elements[i],'blue','blue',3);
                } else {
                    scores.elements.splice(i, 1);
                    i--;
                }
            }
        }
    }
    private renderMovedScores(){        
        if (this.mix.selected.scores.isShifted() || this.drugged){
            for (let i = 0; i < this.mix.selected.scores.elements.length; i++){
                this.renderScore(this.mix.selected.scores.track_index[i], this.mix.selected.scores.elements[i], 'blue', 'blue', 3, true);
            }
        }
    }
    private renderSelection(){
        this.ctx.beginPath();
        this.ctx.fillStyle = "yellow";
        const sel = this.mix.selected.scores;
        this.ctx.fillRect(this.margin_left+sel.start*this.score_w/this.len-this.x, this.margin_top-5, (sel.end-sel.start)*this.score_w/this.len,-4);
        this.ctx.closePath();
    }
    private renderHoveredStartEnd(){
        for (let i = 0; i < this.hovered.scores.length; i++){
            this.ctx.beginPath();
            let start = this.hovered.scores[0].absolute_start;
            let end = this.hovered.scores[0].absolute_start+this.hovered.scores[0].duration;
            if (this.mix.selected.scores.elements.includes(this.hovered.scores[0])) {
                this.ctx.fillStyle = 'yellow';
                start += this.mix.selected.scores.offset.start;
                end += this.mix.selected.scores.offset.duration;
            } else {
                this.ctx.fillStyle = 'blue';
            }
            if (this.hovered.start) {
                this.ctx.fillRect(start*this.score_w/this.len+this.margin_left-2-this.x, this.heights[this.hovered.pos[0]]*this.score_h+this.margin_top, 4, this.score_h);
            } 
            else if (this.hovered.end) {
                this.ctx.fillRect(end*this.score_w/this.len+this.margin_left-2-this.x, this.heights[this.hovered.pos[0]]*this.score_h+this.margin_top, 4, this.score_h);
            }
            this.ctx.closePath();
        }
    }
    getMatrix(x:number,y:number){
        return [(x+this.x/this.width)*this.score_number_on_screen, (y+this.y/this.height)*this.mix.tracks_number_on_screen];
    }
    processInput(x:number, y:number){
        x = (x - this.margin_left)/this.width;
        y = (y - this.margin_top)/this.height;
        return [x,y];
    }
    hitScan(alt:boolean=false, shift:boolean=false, range:number=4):boolean{
        let x = this.input_x;
        let y = this.input_y;
        [x, y] = this.processInput(x, y);
        if (x<0) x=0;
        if (x>1) x=0.99;
        if (y<0) y=0;
        if (y>1) y=0.99;
        [x,y] = this.getMatrix(x,y);
        const xr = x*8;
        if (this.slicerMode)
            x += this.score_w/2/this.width*this.score_number_on_screen;
        x = Math.floor(x);
        y = Math.floor(y);
        if (this.drugged) {
            this.controller.drug(x, y, alt, shift);
            return true;
        }
        let h = 0;
        for (let i = 0; i < this.mix.tracks.length; i++){
            if (y == h){
                this.hovered.track = this.mix.tracks[i];
                if (x-this.x < this.score_number_on_screen) {
                    this.sectorsSelection.setSS1(x, y);
                    this.sectorsSelection.setSS2(x, y);
                    for (let score of this.mix.tracks[i].scores) {
                        this.hovered.end = false;
                        this.hovered.start = false;
                        const start = score.absolute_start;
                        const end = start + score.duration;
                        // console.log(start, xr, end);
                        if (start-range <= xr && xr <= start+range){
                            this.hovered.scores = [score];
                            this.hovered.pos = [i];
                            this.hovered.start = true;
                            return true;
                        } 
                        else if (end-range <= xr && xr <= end+range) {
                            this.hovered.scores = [score];
                            this.hovered.pos = [i];
                            this.hovered.end = true;
                            return true;
                        } 
                        else if (start < xr && xr < end){
                            this.hovered.scores = [score];
                            this.hovered.pos = [i];
                            return true;
                        }
                    } 
                    this.hovered.scores = [];
                    this.hovered.pos = [];
                    return true;
                }
                this.sectorsSelection.zero();
                return true;
            } 
            h += this.mix.tracks[i].renderHeight;
        } 
        this.hovered.scores = [];
        this.sectorsSelection.setSS1(x, y);
        this.sectorsSelection.setSS2(x, y);
        let result = false;
        if (this.hovered.scores.length || this.hovered.track) result = true;
        this.hovered.scores = [];
        this.hovered.track = null;
        return result;
    }
}