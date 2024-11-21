import Mix from "./mix";
import Score from "./score";
import OscDrawer from "./osc_drawer";
import ScoreDrawer from "./score_drawer";
import Track from "./track";
import AudioEffect from "./audio_effects";
import CommandPattern, { Create, Delete } from "./CommandPattern";


export default class MixDrawer{
    drugged:boolean = false;
    w:number;
    h:number;
    margin_top:number;
    margin_left:number;
    width:number;
    height:number;
    tracks_number_on_screen:number = 3;
    score_number_on_screen:number = 16;
    instrument_top:number = 0.08;
    track_h:number;
    score_h:number;
    score_w:number;
    len:number = 8;

    y:number = 0;
    y_max:number;
    x:number = 0;
    x_max:number;
    ctx:CanvasRenderingContext2D;
    selectedTrack:Track|null = null;
    selectedScore:Score|null = null;
    chosenTrack:Track|null = null;
    chosenScore:Score|null = null;
    commandPattern:CommandPattern = new CommandPattern();

    oscDrawer:OscDrawer;
    scoreDrower:ScoreDrawer;

    input_x:number = -1;
    input_y:number = -1;
    grids_in_screen:number = 60;
    constructor(public canvas:HTMLCanvasElement, public mix:Mix, oscDrawer:OscDrawer, scoreDrower:ScoreDrawer){
        this.oscDrawer = oscDrawer;
        this.scoreDrower = scoreDrower;

        this.w = this.canvas.width = canvas.width * devicePixelRatio;
        this.h = this.canvas.height = canvas.height * devicePixelRatio;
        this.canvas.style.width = canvas.width / devicePixelRatio + 'px';
        this.canvas.style.height = canvas.height / devicePixelRatio + 'px';
      
        this.ctx = canvas.getContext('2d') || new CanvasRenderingContext2D();
        this.margin_top = canvas.height/20;
        this.margin_left = this.margin_top;
        this.width = (this.w - 2*this.margin_left);
        this.height = (this.h - 2*this.margin_top);
        this.track_h = this.height/this.tracks_number_on_screen
        this.score_h = this.track_h-this.height*this.instrument_top;
        this.score_w = this.width/this.grids_in_screen;

        this.y_max = (this.mix.tracks.length-this.tracks_number_on_screen+1)*this.track_h;
        this.x_max = (this.mix.tracks[0].scores.length-this.score_number_on_screen)*this.width;

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
                if (this.chosenTrack){
                    if (this.chosenScore){
                        this.commandPattern.addCommand(new Delete(this.chosenTrack, this.chosenScore));
                        this.chosenScore = null;
                    } else {
                        this.commandPattern.addCommand(new Delete(this.mix, this.chosenTrack));
                        this.chosenTrack = null;
                    }
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
                if (this.selectedTrack){
                    this.chosenTrack = this.selectedTrack;
                    this.oscDrawer.oscFunction = this.chosenTrack.inst.osc.oscFunction;
                    this.oscDrawer.render();
                } 
                if (this.selectedScore) {
                    this.chosenScore = this.selectedScore;
                    if (this.scoreDrower.canvas.style.display=='block') {
                        this.scoreDrower.controller.setScore(this.chosenScore);
                    }
                    this.mix.start = this.chosenScore.start_time/2;
                } else {
                    this.chosenScore = null;
                    this.scoreDrower.controller.setScore(this.chosenScore);
                }
            } else if (e.button==2){
                if (this.chosenTrack){
                    this.commandPattern.addCommand(new Create(this.chosenTrack, new Score(0)))
                }
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
    render() {
        // need fix
        this.y_max = (this.mix.tracks.length-this.tracks_number_on_screen+1)*this.track_h;
        if (this.y_max<0) this.y_max = 0;
        this.x_max = (this.mix.tracks[0].scores.length-this.score_number_on_screen)*this.score_w;
        if (this.x_max<0) this.x_max = 0;
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.ctx.font = "16px system-ui";
        
        for (let i=0; i<this.mix.tracks.length;i++){
            for (let j=0; j<this.mix.tracks[i].scores.length; j++){
                this.renderScore(i, j, this.mix.tracks[i].scores[j]==this.selectedScore, this.mix.tracks[i].scores[j]==this.chosenScore);
            }
            this.renderTrack(i, this.mix.tracks[i]==this.selectedTrack, this.mix.tracks[i]==this.chosenTrack);
            this.renderGrid(i);
        }
        
        this.renderFrame();
        this.renderTime();
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
    renderTrack(i:number, selected:boolean, chosen:boolean){
        let inst_top = this.instrument_top*this.height;
        let y = this.margin_top-this.y;
        if (chosen) {
            this.ctx.fillStyle = 'blue';
            this.ctx.strokeStyle = 'white';
        } else if (selected){
            this.ctx.fillStyle = 'red';
            this.ctx.strokeStyle = 'white';
        } else {
            this.ctx.fillStyle = 'black';
            this.ctx.strokeStyle = 'white';
        }

        this.ctx.beginPath();
        // 0 0
        this.ctx.moveTo(this.margin_left, i*this.track_h+y);
        // 4 0
        this.ctx.lineTo(this.w-this.margin_left, i*this.track_h+y);
        // 4 4
        this.ctx.lineTo(this.w-this.margin_left, (i+1)*this.track_h+y);
        // 0 4
        this.ctx.lineTo(this.margin_left, (i+1)*this.track_h+y);
        // 0 0
        this.ctx.lineTo(this.margin_left, i*this.track_h+y);
        // 1 1
        this.ctx.lineTo(this.margin_left, inst_top+i*(this.track_h)+y);
        // 1 3
        this.ctx.lineTo(this.margin_left, (i+1)*(this.track_h)+y);
        // 3 3
        this.ctx.lineTo(this.w-this.margin_left, (i+1)*(this.track_h)+y);
        // 3 1
        this.ctx.lineTo(this.w-this.margin_left, inst_top+i*(this.track_h)+y);
        // 1 1
        this.ctx.lineTo(this.margin_left, inst_top+i*(this.track_h)+y);
        // 0 0
        this.ctx.lineTo(this.margin_left, i*this.track_h+y);
        this.ctx.fill();
        this.ctx.closePath();
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(this.mix.tracks[i].name, this.margin_left+7, inst_top+i*this.track_h+y-5);

        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.margin_left, this.margin_top+i*this.track_h-this.y, this.width, this.track_h);
        this.ctx.stroke();
        this.ctx.closePath();
    }
    renderScore(i:number,j:number, selected:boolean, chosen:boolean) {
        const start_x = this.margin_left + this.score_w*this.mix.tracks[i].scores[j].start_time/this.len-this.x;
        // console.log(start_x)
        const dur_x = this.score_w*this.mix.tracks[i].scores[j].duration/this.len;
        const start_y = this.margin_top + this.instrument_top*this.height*(i+1) + i*this.score_h-this.y;
        this.ctx.beginPath();
        if (chosen) {
            this.ctx.fillStyle = 'blue';
            this.ctx.strokeStyle = 'blue';
        } else if (selected){
            this.ctx.fillStyle = 'red';
            this.ctx.strokeStyle = 'red';
        } else {
            this.ctx.fillStyle = 'black';
            this.ctx.strokeStyle = 'black';
        }
        this.ctx.fillRect(start_x, start_y, dur_x, this.score_h);
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = 'white';
        this.ctx.strokeRect(start_x, start_y, dur_x, this.score_h);
        this.ctx.closePath();
    }
    doubleInput(x:number, y:number){
        if (x >= this.margin_left && x <= this.w-this.margin_left && y >= this.margin_top && y <= this.h-this.margin_top){
            if (!this.selectedTrack) this.commandPattern.addCommand(new Create(this.mix, new Track('track '+ (this.mix.tracks.length+1).toString())));
            if (this.chosenTrack){
                if (this.chosenScore){
                    if (this.scoreDrower.canvas.style.display=='block') {
                        this.scoreDrower.controller.setScore(null);
                    } else {
                        this.scoreDrower.controller.setScore(this.chosenScore);
                    }
                }
            }
            this.find();
            this.render();
        }
    }
    find(){
        let x = this.input_x;
        let y = this.input_y;
        if (x >= 0 && x <= this.w && y >= 0 && y <= this.h){
            for (let i=0; i<this.mix.tracks.length;i++){
                if (y >= this.margin_top+i*this.track_h-this.y && y <= this.margin_top+(i+1)*this.track_h-this.y){
                    this.selectedTrack = this.mix.tracks[i];
                    for (let j=0; j<this.mix.tracks[i].scores.length; j++){
                        let start_x = this.margin_left + this.mix.tracks[i].scores[j].start_time*this.score_w/this.len-this.x;
                        let start_y = this.margin_top + this.instrument_top*this.height*(i+1) + i*this.score_h-this.y;
                        if (x >= start_x && x <= start_x+this.score_w*this.mix.tracks[i].scores[j].duration/this.len && y >= start_y && y <= start_y+this.score_h){
                            this.selectedScore = this.mix.tracks[i].scores[j];
                            return;
                        }
                    } this.selectedScore = null;
                    return;
                }
            } 
        } this.selectedTrack = null;
        this.selectedScore = null;
    }
    addAudioEffect(effect:AudioEffect){
        if (this.chosenTrack) {
            this.chosenTrack.audioEffects.push(effect);
        }
    }
} 