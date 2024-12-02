import Mix from "../data/mix";
import Score from "../data/score";
import OscDrawer from "../drawers/osc_drawer";
import ScoreDrawer from "./score_drawer";
import Track from "../data/track";
import AudioEffect from "../classes/audio_effects";
import Selection from "../classes/selection";
import CommandPattern, { Create, Delete } from "../classes/CommandPattern";
import Drawer from "./Drawer";
import WindowController from "../classes/WindowController";

export class sc{
    score:Score;
    index:number;
    constructor(score:Score, index:number){
        this.score = score;
        this.index = index;
    }
}

export class tr{
    track:Track;
    index:number;
    constructor(track:Track, index:number){
        this.track = track;
        this.index = index;
    }
}

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

    y:number = 0;
    y_max:number=0;
    x:number = 0;
    x_max:number=0;

    hovered:{scores:sc[],track:Track|null,start:boolean,end:boolean} = {scores:[],track:null,start:false,end:false}
    
    sectorsSelection:{x1:number,y1:number,x2:number,y2:number} = {x1:-1, y1:-1, x2:-1, y2:-1}
    
    commandPattern:CommandPattern = new CommandPattern();

    tracks_min_max:number[][] = [];

    oscDrawer:OscDrawer;

    input_x:number = -1;
    input_y:number = -1;
    scores:Selection = new Selection();
    tracks:Selection = new Selection();
    constructor(public canvas:HTMLCanvasElement, public mix:Mix,  oscDrawer:OscDrawer, public score_window:WindowController, width:number, height:number){

        super(canvas);
        this.oscDrawer = oscDrawer;
        this.setCanvasSize(width,height);
        for (let i=0; i<this.mix.tracks.length; i++){
            let m = 127;
            let M = 0;
            for (let score of this.mix.tracks[i].scores){
                for (let note of score.notes){
                    m = Math.min(m, note.pitch);
                    M = Math.max(M, note.pitch);
                }
            }
            this.tracks_min_max.push([m, M]);
        } 

        canvas.onselectstart = function () { return false; }
        canvas.tabIndex = 0;

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY){
                let y = e.deltaY;
                if (e.ctrlKey){
                    this.score_number_on_screen += y/Math.abs(y)*2;
                    this.x -= y;
                    if (this.x > this.x_max) this.x = this.x_max;
                    if (this.x < 0) this.x = 0;
                    this.score_number_on_screen = Math.max(this.score_number_on_screen,2);
                    this.score_w = this.width/this.score_number_on_screen;
                    this.calcMaxes();
                } else if (e.shiftKey){
                    this.x += y;
                    if (this.x > this.x_max) this.x = this.x_max;
                    if (this.x < 0) this.x = 0;
                } else {
                    this.y += y;
                    if (this.y > this.y_max) this.y = this.y_max;
                    if (this.y < 0) this.y = 0;
                }
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
            if (this.hitScan()){
                this.render();
            }
        });
        canvas.addEventListener('dblclick', () => {
            this.doubleInput(this.input_x, this.input_y);
        });
        canvas.addEventListener('keydown', (e) => {
            if (e.code!="KeyS" && e.code!="KeyI" && e.code!="Space"){
                e.stopPropagation();
            }
            if (e.code=="KeyA" && e.ctrlKey){
                e.preventDefault();
            }
            if (e.code=="Delete" || e.code=="Backspace"){
                if (this.scores.selected.length){
                    this.commandPattern.addCommand(new Delete(this.mix, this.scores.selected));
                    this.scores.selected = [];          
                } else if (this.tracks.selected.length){
                    this.commandPattern.addCommand(new Delete(this.mix, this.tracks.selected));
                    this.tracks.selected = [];
                }
                this.calcMaxes();
            }
            if (e.code=="KeyZ" && e.ctrlKey){
                if (e.shiftKey){
                    this.commandPattern.redo();
                } else {
                    this.commandPattern.undo();
                }
            }
            this.hitScan();
            this.render();
        });
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        })
        canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (e.button==0){
                if (this.hovered.track){
                    if (!e.shiftKey)
                        this.tracks.selected = [];
                    this.tracks.selected.push(new tr(this.hovered.track, this.mix.tracks.indexOf(this.hovered.track)));
                    this.oscDrawer.oscFunction = this.hovered.track.inst.osc.oscFunction;
                    this.mix.start = this.sectorsSelection.x1*4;
                } 
                if (this.hovered.scores.length) {
                    if (e.shiftKey)
                        this.scores.selected.push(this.hovered.scores[0]);
                    else
                        this.scores.selected = [this.hovered.scores[0]];
                    let drawer = this.score_window.drawer;
                    if (drawer instanceof ScoreDrawer) {
                        if (drawer.canvas.style.display=='block')
                            drawer.controller.setScore(this.scores.getLast().score);

                    }
                    this.mix.start = this.hovered.scores[0].score.start_time/2;
                } else {
                    this.scores.selected = [];
                    this.score_window.close();
                }
            }
            // this.commandPattern.addCommand(new Create(this.chosenTrack, new Score(0)))
            this.render();
        });
        canvas.addEventListener('pointerup', () => {
            this.drugged = false;
        });
        canvas.addEventListener('pointerleave', () => {
            this.input_x = -1;
            this.input_y = -1;
            if (this.hitScan()){
                this.render();
            }
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
        this.track_h = this.height/this.tracks_number_on_screen
        this.score_h = this.track_h;
        this.score_w = this.width/this.score_number_on_screen;
        this.calcMaxes();
    }
    calcMaxes(){
        this.y_max = (this.mix.tracks.length-this.tracks_number_on_screen+2)*this.track_h;
        if (this.y_max<0) this.y_max = 0;
        this.x_max = (this.mix.tracks[0].scores.length*4-this.score_number_on_screen+6)*this.score_w;
        if (this.x_max<0) this.x_max = 0;
    }
    render() {
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.ctx.font = "16px system-ui";
        this.renderBack();
        
        let h = 0;
        for (let i = 0; i < this.mix.tracks.length; i++){
            for (let j = 0; j < this.mix.tracks[i].scores.length; j++){
                this.renderScore(i, j);
            }
            this.renderTrack(h,this.mix.tracks[i].renderHeight);
            h += this.mix.tracks[i].renderHeight;
        }
        this.renderHovered();
        this.renderSelected();
        this.renderTime();
        this.renderFrame();
        if (!this.hovered.scores.length && this.hovered.track) this.renderSector()
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
    renderScore(i:number, j:number, hovered:boolean=false, selected:boolean=false) {
        let score = this.mix.tracks[i].scores[j];
        const start_x = this.margin_left + this.score_w * score.start_time/this.len-this.x;
        const dur_x = this.score_w*score.duration/this.len;
        const start_y = this.margin_top + i*this.score_h-this.y;
        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        if (selected) {
            this.ctx.fillStyle = 'blue';
            this.ctx.strokeStyle = 'blue';
            this.ctx.lineWidth = 3;
        } else if (hovered){
            this.ctx.fillStyle = 'yellow';
            this.ctx.strokeStyle = 'yellow';
            this.ctx.lineWidth = 3;
        } else {
            this.ctx.fillStyle = 'white';
            this.ctx.strokeStyle = 'white';
        }
        // this.ctx.fillRect(start_x, start_y, dur_x, this.score_h);
        // this.ctx.fillStyle = 'blue';
        
        this.ctx.strokeRect(start_x, start_y, dur_x, this.score_h);

        let m = this.tracks_min_max[i][0]-3;
        let M = this.tracks_min_max[i][1]+3;
        let nh = this.score_h/(M-m)-1;
        let k = this.score_w/score.duration*4
        for (let note of score.notes){
            let y = start_y + this.score_h*(1-(note.pitch-m)/(M-m));
            this.ctx.fillRect(start_x+note.start*k, y, note.duration*k, nh);
        }
        this.ctx.closePath();
    }
    renderSector(){
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(255,255,0,0.8)';
        this.ctx.lineWidth = 2;
        let ss = this.sectorsSelection;
        this.ctx.strokeRect(ss.x1*this.score_w+this.margin_left-this.x, ss.y1*this.score_h+this.margin_top-this.y, (ss.x2-ss.x1+1)*this.score_w, (ss.y2-ss.y1+1)*this.score_h);
        this.ctx.closePath();
    }
    renderHovered(){
        if (this.hovered.track){
            let i = this.mix.tracks.indexOf(this.hovered.track);
            let y = this.margin_top + i*this.track_h-this.y;
            this.ctx.beginPath();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fillRect(this.margin_left+this.width, y, this.w*this.instrument_width, this.track_h);
            this.ctx.closePath();
        }
        if (this.hovered.scores.length && this.hovered.track){
            for (let sc of this.hovered.scores){
                let i = sc.index;
                let j = this.mix.tracks[i].scores.indexOf(sc.score);
                this.renderScore(i, j, true);
            }
        }
    }
    renderSelected(){
        for (let sc of this.scores.selected){
            let i = sc.index;
            let j = this.mix.tracks[i].scores.indexOf(sc.score);
            this.renderScore(i, j, false, true);
        }
        if (this.tracks.selected.length){
            for (let track of this.tracks.selected){
                this.renderInst(track.index,'black','yellow');
            }
        }
    }

    doubleInput(x:number, y:number){
        if (x >= this.margin_left && x <= this.w-this.margin_left && y >= this.margin_top && y <= this.h-this.margin_top){
            if (!this.hovered.track) {
                this.commandPattern.addCommand(new Create(this.mix, new Track('track')));
                this.calcMaxes();
                this.render();
            }
            if (this.scores.selected.length) {
                let drawer = this.score_window.drawer;
                if (drawer instanceof ScoreDrawer) {
                    if (drawer.canvas.style.display=='block') {
                        this.score_window.close();
                    } else {
                        drawer.controller.setScore(this.scores.getLast().score);
                        this.score_window.open();
                    }
                }
            }
            if (this.hitScan()){
                this.render();
            }
        }
    }
    getMatrix(x:number,y:number){
        return [Math.floor(x*this.score_number_on_screen), Math.floor(y*this.tracks_number_on_screen)];
    }
    processInput(x:number, y:number){
        x = (x - this.margin_left)/this.width;
        y = (y - this.margin_top)/this.height;
        return [x,y];
    }
    hitScan():boolean{
        let x = this.input_x;
        let y = this.input_y;

        [x, y] = this.processInput(x, y);
        if (x >= 0 && x <= 2 && y >= 0 && y <= 1){
            [x,y] = this.getMatrix(x+this.x/this.width, y+this.y/this.height);
            let h = 0;
            for (let i = 0; i < this.mix.tracks.length; i++){
                if (y == h){
                    this.hovered.track = this.mix.tracks[i];
                    if (x < this.score_number_on_screen) {
                        for (let score of this.mix.tracks[i].scores) {
                            let start_x = score.start_time;
                            if (x*8 >= start_x && x*8 < start_x+score.duration){
                                this.hovered.scores = [new sc(score, i)];
                                this.zero();
                                return true;
                            }
                        } 
                        this.hovered.scores = [];
                        this.sectorsSelection.x1 = x;
                        this.sectorsSelection.y1 = y;
                        this.sectorsSelection.x2 = x;
                        this.sectorsSelection.y2 = y;
                        return true;
                    }
                    this.zero();
                    return true;
                } 
                h += this.mix.tracks[i].renderHeight;
            } 
            this.hovered.scores = [];
            this.sectorsSelection.x1 = x;
            this.sectorsSelection.y1 = y;
            this.sectorsSelection.x2 = x;
            this.sectorsSelection.y2 = y;
        } 
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
        for (let track of this.tracks.selected){
            track.track.audioEffects.push(effect);
        }
    }
} 