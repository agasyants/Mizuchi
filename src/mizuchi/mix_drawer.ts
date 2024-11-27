import Mix from "./mix";
import Score from "./score";
import OscDrawer from "./osc_drawer";
import ScoreDrawer from "./score_drawer";
import Track from "./track";
import AudioEffect from "./audio_effects";
import Selection from "./selection";
import CommandPattern, { Create, Delete } from "./CommandPattern";
import Drawer from "./Drawer";
import WindowController from "./WindowController";

class sc{
    score:Score;
    index:number;
    constructor(score:Score, index:number){
        this.score = score;
        this.index = index;
    }
}

export default class MixDrawer extends Drawer{
    drugged:boolean = false;
    width:number=0;
    height:number=0;
    tracks_number_on_screen:number = 3;
    score_number_on_screen:number = 16;
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


    oscDrawer:OscDrawer;

    input_x:number = -1;
    input_y:number = -1;
    grids_in_screen:number = 60;
    scores:Selection = new Selection();
    tracks:Selection = new Selection();
    constructor(public canvas:HTMLCanvasElement, public mix:Mix, oscDrawer:OscDrawer, public score_window:WindowController){

        super(canvas);
        this.oscDrawer = oscDrawer;
        this.setCanvasSize(canvas.width,canvas.height); 

        canvas.onselectstart = function () { return false; }
        canvas.tabIndex = 0;

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY){
                if (e.ctrlKey){
                    this.x += e.deltaY;
                } else {
                    this.y += e.deltaY;
                }
                if (this.y > this.y_max) this.y = this.y_max;
                if (this.y < 0) this.y = 0;
                if (this.x > this.x_max) this.x = this.x_max;
                if (this.x < 0) this.x = 0;
                this.find();
                this.render();
            }
        });
        canvas.addEventListener('pointermove', (e) => {
            const rect = canvas.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            this.input_x = x * devicePixelRatio;
            this.input_y = y * devicePixelRatio;
            this.find();
            this.render();
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
                    this.commandPattern.addCommand(new Delete(this.mix, this.scores));
                    this.scores.selected = [];
                } else if (this.tracks.selected.length){
                    this.commandPattern.addCommand(new Delete(this.mix, this.tracks));
                    this.tracks.selected = [];
                }
            }
            if (e.code=="KeyZ" && e.ctrlKey){
                if (e.shiftKey){
                    this.commandPattern.redo();
                } else {
                    this.commandPattern.undo();
                }
            }
            this.render();
        });
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        })
        canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (e.button==0){
                if (this.hovered.track){
                    this.tracks.selected = [this.hovered.track];
                    this.oscDrawer.oscFunction = this.hovered.track.inst.osc.oscFunction;
                    this.oscDrawer.render();
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
                    // this.scoreDrower.controller.setScore(null);
                }
            } else if (e.button==2){
                // if (this.chosenTrack){
                //     this.commandPattern.addCommand(new Create(this.chosenTrack, new Score(0)))
                // }
            }
            this.render();
        });
        canvas.addEventListener('pointerup', () => {
            this.drugged = false;
        });
        canvas.addEventListener('pointerleave', () => {
            this.input_x = -1;
            this.input_y = -1;
            this.find();
            this.render();
        });
        canvas.addEventListener('pointerover', () => {
            // if (!this.scoreDrower.canvas.style.display){
                this.canvas.focus();
            // }
        });
        this.render()
    }
    setCanvasSize(width: number, height: number): void {
        super.setCanvasSize(width, height);
        this.width = (this.w - 2*this.margin_left);
        this.height = (this.h - 2*this.margin_top);
        this.track_h = this.height/this.tracks_number_on_screen
        this.score_h = this.track_h;
        this.score_w = this.width/this.grids_in_screen;

        this.y_max = (this.mix.tracks.length-this.tracks_number_on_screen+1)*this.track_h;
        this.x_max = (this.mix.tracks[0].scores.length-this.score_number_on_screen)*this.width;
    }
    render() {
        // need fix
        this.y_max = (this.mix.tracks.length-this.tracks_number_on_screen+1)*this.track_h;
        if (this.y_max<0) this.y_max = 0;
        this.x_max = (this.mix.tracks[0].scores.length-this.score_number_on_screen)*this.score_w;
        if (this.x_max<0) this.x_max = 0;
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.ctx.font = "16px system-ui";
        
        let h = 0;
        for (let i=0; i<this.mix.tracks.length;i++){
            for (let j=0; j<this.mix.tracks[i].scores.length; j++){
                this.renderScore(i, j);
            }
            this.renderGrid(i);
            this.renderTrack(h,this.mix.tracks[i].renderHeight);
            h += this.mix.tracks[i].renderHeight;
        }
        this.renderHovered();
        this.renderSelected();
        this.renderFrame();
        this.renderTime();
        this.renderSector()
    }
    renderGrid(i:number){
        for (let j = 0; j < this.grids_in_screen; j++){
            let x = j*this.score_w-this.x + this.margin_left;
            let y = i*this.track_h-this.y + this.margin_top;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, y+this.track_h);
            this.ctx.strokeStyle = 'rgba(225,225,255,0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }
    renderTime(){
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'yellow';
        this.ctx.lineWidth = 4;
        this.ctx.moveTo(this.margin_left+this.mix.start*this.score_w/4, 0);
        this.ctx.lineTo(this.margin_left+this.mix.start*this.score_w/4, this.height);
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
        let inst_left = (1-this.instrument_width)*this.width;
        let y = this.margin_top-this.y;
        this.ctx.fillStyle = fillColor;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.beginPath();
        this.ctx.fillRect(this.margin_left+inst_left, i*this.track_h+y, this.instrument_width*this.width, this.track_h);
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(this.margin_left+inst_left, i*this.track_h+y, this.instrument_width*this.width, this.track_h);
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(this.mix.tracks[i].name, this.margin_left+inst_left+6, i*this.track_h+y+20);
        this.ctx.closePath();
    }
    renderScore(i:number, j:number, hovered:boolean=false, selected:boolean=false) {
        const start_x = this.margin_left + this.score_w*this.mix.tracks[i].scores[j].start_time/this.len-this.x;
        const dur_x = this.score_w*this.mix.tracks[i].scores[j].duration/this.len;
        const start_y = this.margin_top + i*this.score_h-this.y;
        this.ctx.beginPath();
        if (selected) {
            this.ctx.fillStyle = 'black';
            this.ctx.strokeStyle = 'blue';
        } else if (hovered){
            this.ctx.fillStyle = 'black';
            this.ctx.strokeStyle = 'yellow';
        } else {
            this.ctx.fillStyle = 'black';
            this.ctx.strokeStyle = 'white';
        }
        this.ctx.fillRect(start_x, start_y, dur_x, this.score_h);
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(start_x, start_y, dur_x, this.score_h);
        this.ctx.closePath();
    }
    renderSector(){
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(255,255,0,0.8)';
        this.ctx.lineWidth = 3;
        let ss = this.sectorsSelection;
        this.ctx.strokeRect(ss.x1*this.score_w+this.margin_left+this.x, ss.y1*this.score_h+this.margin_top-this.y, (ss.x2-ss.x1+1)*this.score_w, (ss.y2-ss.y1+1)*this.score_h);
        this.ctx.closePath();
    }
    renderHovered(){
        if (this.hovered.track){
            let i = this.mix.tracks.indexOf(this.hovered.track);
            let y = this.margin_top + i*this.track_h-this.y;
            this.ctx.beginPath();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fillRect(this.margin_left, y, this.width, this.track_h);
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
                let i = this.mix.tracks.indexOf(track);
                this.renderInst(i,'black','yellow');
            }
        }
    }


    doubleInput(x:number, y:number){
        if (x >= this.margin_left && x <= this.w-this.margin_left && y >= this.margin_top && y <= this.h-this.margin_top){
            if (!this.hovered.track) this.commandPattern.addCommand(new Create(this.mix, new Track('track '+ (this.mix.tracks.length+1).toString())));
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
            this.find();
            this.render();
        }
    }
    getMatrix(x:number,y:number){
        return [Math.floor(x*this.grids_in_screen), Math.floor(y*this.tracks_number_on_screen)];
    }
    processInput(x:number, y:number){
        x = (x - this.margin_left)/this.width;
        y = (y - this.margin_top)/this.height;
        return [x,y];
    }
    find(){
        let x = this.input_x;
        let y = this.input_y;
        [x, y] = this.processInput(x, y);
        if (x >= 0 && x <= 1 && y >= 0 && y <= 1){
            [x,y] = this.getMatrix(x+this.x/this.width, y+this.y/this.height);
            // console.log(x,y);
            let h = 0;
            for (let i=0; i < this.mix.tracks.length; i++){
                if (y == h){
                    this.hovered.track = this.mix.tracks[i];
                    for (let score of this.mix.tracks[i].scores){
                        let start_x = score.start_time;
                        if (x*8 >= start_x && x*8 < start_x+score.duration){
                            this.hovered.scores = [new sc(score, i)];
                            this.sectorsSelection.x1 = -1;
                            this.sectorsSelection.y1 = -1;
                            this.sectorsSelection.x2 = -1;
                            this.sectorsSelection.y2 = -1;
                            return;
                        }
                    } 
                    this.hovered.scores = [];
                    this.sectorsSelection.x1 = x;
                    this.sectorsSelection.y1 = y;
                    this.sectorsSelection.x2 = x;
                    this.sectorsSelection.y2 = y;
                    return;
                } 
                h += this.mix.tracks[i].renderHeight;
            } 
            this.hovered.scores = [];
            this.sectorsSelection.x1 = x;
            this.sectorsSelection.y1 = y;
            this.sectorsSelection.x2 = x;
            this.sectorsSelection.y2 = y;
        } 
        this.hovered.track = null;
    }
    addAudioEffect(effect:AudioEffect){
        for (let track of this.tracks.selected){
            track.audioEffects.push(effect);
        }
    }
} 