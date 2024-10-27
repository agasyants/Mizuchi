import Instrument from "./instrument";
import Mix from "./mix";
import Score from "./score";
import OscDrawer from "./osc_drawer";
import ScoreDrawer from "./score_drawer";


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
    instrument_frame:number = 0.006;
    instrument_top:number = 0.08;
    track_h:number;
    score_h:number;
    score_w:number;

    y:number = 0;
    y_max:number;
    x:number = 0;
    x_max:number;
    ctx:CanvasRenderingContext2D;
    selectedInst:Instrument|null = null;
    selectedScore:Score|null = null;
    chosenInst:Instrument|null = null;
    chosenScore:Score|null = null;

    oscDrawer:OscDrawer;
    scoreDrower:ScoreDrawer;

    input_x:number = -1;
    input_y:number = -1;
    constructor(public canvas:HTMLCanvasElement, public mix:Mix, oscDrawer:OscDrawer, scoreDrower: ScoreDrawer){
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
        this.score_h = this.track_h-this.width*this.instrument_frame-this.height*this.instrument_top;
        this.score_w = this.width*(1-this.instrument_frame*2)/this.score_number_on_screen;

        this.y_max = (this.mix.tracks.length-this.tracks_number_on_screen+1)*this.track_h;
        this.x_max = (this.mix.tracks[0].scores.length-this.score_number_on_screen)*this.width;

        canvas.onselectstart = function () { return false; }
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
            if (this.chosenInst && this.mix.tracks.length > 1){
                for (let i of this.mix.tracks) if (i.inst==this.chosenInst) this.mix.removeTrack(i);
                this.chosenInst = null;
                this.find();
                this.render();
            }
        });
        canvas.addEventListener('pointerdown', () => {
            if (this.chosenInst){
                this.oscDrawer.oscFunction = this.chosenInst.osc.oscFunction;
            }
            if (this.selectedInst){
                this.chosenInst = this.selectedInst;
                this.oscDrawer.oscFunction = this.chosenInst.osc.oscFunction;
                this.oscDrawer.render();
            }
            if (this.chosenScore && this.chosenScore==this.selectedScore){
                this.chosenScore = null;
                this.scoreDrower.setScore(this.chosenScore);
            } else if (this.selectedScore){
                this.chosenScore = this.selectedScore;
                this.scoreDrower.setScore(this.chosenScore);
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
            this.renderTracks(i, this.mix.tracks[i].inst==this.selectedInst, this.mix.tracks[i].inst==this.chosenInst);
        }

        this.renderFrame();
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
    renderTracks(i:number, selected:boolean, chosen:boolean){
        let inst_top = this.instrument_top*this.height;
        let inst_left_right = this.instrument_frame*this.width;
        let inst_bottom = inst_left_right;
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
        this.ctx.lineTo(this.margin_left+inst_left_right, inst_top+i*(this.track_h)+y);
        // 1 3
        this.ctx.lineTo(this.margin_left+inst_left_right, (i+1)*(this.track_h)-inst_bottom+y);
        // 3 3
        this.ctx.lineTo(this.w-this.margin_left-inst_left_right, (i+1)*(this.track_h)-inst_bottom+y);
        // 3 1
        this.ctx.lineTo(this.w-this.margin_left-inst_left_right, inst_top+i*(this.track_h)+y);
        // 1 1
        this.ctx.lineTo(this.margin_left+inst_left_right, inst_top+i*(this.track_h)+y);
        // 0 0
        this.ctx.lineTo(this.margin_left, i*this.track_h+y);
        this.ctx.fill();
        this.ctx.closePath();
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(this.mix.tracks[i].name, this.margin_left+inst_left_right, inst_top+i*this.track_h+y-5);

        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.margin_left, this.margin_top+i*this.track_h-this.y, this.width, this.track_h);
        this.ctx.stroke();
        this.ctx.closePath();
    }
    renderScore(i:number,j:number, selected:boolean, chosen:boolean) {
        const start_x = this.margin_left + this.instrument_frame*this.width + j*this.score_w-this.x;
        const start_y = this.margin_top + this.instrument_top*this.height*(i+1) + i*(this.score_h+this.instrument_frame*this.width)-this.y;
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
        this.ctx.fillRect(start_x, start_y, this.score_w, this.score_h);
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = 'white';
        this.ctx.strokeRect(start_x, start_y, this.score_w, this.score_h);
        this.ctx.closePath();
    }
    find(){
        let x = this.input_x;
        let y = this.input_y;
        if (x >= 0 && x <= this.w && y >= 0 && y <= this.h){
            for (let i=0; i<this.mix.tracks.length;i++){
                if (y >= this.margin_top+i*this.track_h-this.y && y <= this.margin_top+(i+1)*this.track_h-this.y){
                    this.selectedInst = this.mix.tracks[i].inst;
                    for (let j=0; j<this.mix.tracks[i].scores.length; j++){
                        let start_x = this.margin_left + this.instrument_frame*this.width + j*this.score_w-this.x;
                        let start_y = this.margin_top + this.instrument_top*this.height*(i+1) + i*(this.score_h+this.instrument_frame*this.width)-this.y;
                        if (x >= start_x && x <= start_x+this.score_w && y >= start_y && y <= start_y+this.score_h){
                            this.selectedScore = this.mix.tracks[i].scores[j];
                            return;
                        }
                    } this.selectedScore = null;
                    return;
                }
            } 
        } this.selectedInst = null;
        this.selectedScore = null;
    }
} 