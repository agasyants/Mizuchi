import OscFunction from "../data/osc_function";
import  CommandPattern,{ Create, Delete, Move } from "../classes/CommandPattern";
import { BasicPoint, HandlePoint, Point } from "../curves/function";

export default class OscDrawer{
    commandPattern:CommandPattern;
    chosenPoint:Point|null = null;
    drugged:number = -1;
    render_handles:boolean = false;
    w:number;
    h:number;
    margin_top:number;
    margin_left:number;
    width:number;
    height:number;
    ctx:CanvasRenderingContext2D;
    range:number = 0.03;
    cursor:Point|null=null;

    constructor(public canvas:HTMLCanvasElement, public oscFunction:OscFunction){
        this.commandPattern = new CommandPattern();

        this.w = this.canvas.width = canvas.width * devicePixelRatio;
        this.h = this.canvas.height = canvas.height * devicePixelRatio;
        this.canvas.style.width = canvas.width / devicePixelRatio + 'px';
        this.canvas.style.height = canvas.height / devicePixelRatio + 'px';
      
        this.ctx = canvas.getContext('2d') || new CanvasRenderingContext2D();
        this.margin_top = canvas.height/12;
        this.margin_left = this.margin_top;
        this.width = (this.w - 2*this.margin_left);
        this.height = (this.h - 2*this.margin_top);
        this.ctx.translate(this.margin_left, this.h/2);

        canvas.onselectstart = function () { return false; }
        canvas.tabIndex = 1;
        this.initializeListeners()
        this.render()
    }
    initializeListeners(){
        this.canvas.addEventListener('dblclick', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left)/rect.width;
            const y = (e.clientY - rect.top)/rect.height-0.5;
            this.doubleInput(x,y);
            this.render();
        });
        this.canvas.addEventListener('keydown', (e) => {
            if (e.code!="KeyS" && e.code!="KeyI" && e.code!="Space"){
                e.stopPropagation();
            }
            if (e.code=="KeyA" && e.ctrlKey){
                e.preventDefault();
                console.log("Osc");
            }
            if (e.code=="KeyZ" && e.ctrlKey){
                e.preventDefault();
                if (e.shiftKey){
                    this.commandPattern.redo();
                } else {
                    this.commandPattern.undo();
                } this.render();
            }
        });
        this.canvas.addEventListener('pointermove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            let x = (e.clientX - rect.left)/rect.width;
            let y = (e.clientY - rect.top)/rect.height-0.5;
            [x,y] = this.processInput(x,y);
            if (this.drugged==-1){
                this.findPoint(x,y,this.range);
            }
            if (e.ctrlKey && this.chosenPoint){
                this.render(this.chosenPoint.x, y);
            } else if (e.shiftKey && this.chosenPoint){
                this.render(x, this.chosenPoint.y);
            } else {
                this.render(x, y);
            }
        });
        this.canvas.addEventListener('pointerdown', (e) => {
            this.canvas.setPointerCapture(e.pointerId);
            if (this.chosenPoint){
                if (this.chosenPoint instanceof BasicPoint){
                    this.drugged = this.oscFunction.basics.findIndex((e)=>(e == this.chosenPoint));
                } else if (this.chosenPoint instanceof HandlePoint){
                    this.drugged = this.oscFunction.handles.findIndex((e)=>(e == this.chosenPoint));
                }                
            }
        });
        this.canvas.addEventListener('pointerup', (e) => {
            this.canvas.releasePointerCapture(e.pointerId);
            if (this.drugged!=-1 && this.chosenPoint){
                const rect = this.canvas.getBoundingClientRect();
                let x = (e.clientX - rect.left)/rect.width;
                let y = (e.clientY - rect.top)/rect.height-0.5;
                [x,y] = this.processInput(x,y);
                x = x-this.chosenPoint.x;
                y = y-this.chosenPoint.y;
                if (Math.sqrt(x*x+y*y)>this.range){
                    if (e.ctrlKey){
                        this.commandPattern.addCommand(new Move(this.oscFunction,[this.chosenPoint],[0,y]));
                    } else if (e.shiftKey){
                        this.commandPattern.addCommand(new Move(this.oscFunction,[this.chosenPoint],[x,0]));
                    } else {
                        this.commandPattern.addCommand(new Move(this.oscFunction,[this.chosenPoint],[x,y]));
                    }
                }
            }
            this.drugged = -1;
        });
        this.canvas.addEventListener('pointerleave', () => {
            this.render_handles = false;
            this.chosenPoint = null;

            this.render();
        });
        this.canvas.addEventListener('pointerover', () => {
            this.render_handles = true;
            this.canvas.focus();
        });
    }
    render(x:number=0, y:number=0) {
        this.ctx.clearRect(-this.margin_left, -this.h/2, this.w, this.h);
        this.ctx.font = "14px system-ui";
        let basics = [];
        if (this.chosenPoint instanceof BasicPoint && this.drugged==0){
            [x, y] = this.oscFunction.calcBasic(this.chosenPoint,0, x, y);
            basics.push(new BasicPoint(x,y,-1));

        } else {
            basics.push(this.oscFunction.basics[0]);
        }
        let handles = [];
        if (this.chosenPoint instanceof HandlePoint){
            for (let i=0; i<this.oscFunction.handles.length; i++){
                if (this.drugged==i){
                    basics.push(this.oscFunction.basics[i+1]);
                    [x,y] = this.oscFunction.calcHandle(i,x,y);
                    let [xl,yl] = this.oscFunction.setHandleAbsPos(i, x, y);
                    handles.push(new HandlePoint(x, y, xl, yl));
                } else {
                    basics.push(this.oscFunction.basics[i+1]);
                    handles.push(this.oscFunction.handles[i]);
                }
            }
        } else if (this.chosenPoint instanceof BasicPoint && this.drugged!=0) {
            for (let i=0; i<this.oscFunction.handles.length; i++){
                if (this.drugged-1==i){
                    [x, y] = this.oscFunction.calcBasic(this.chosenPoint, i+1, x, y);
                    basics.push(new BasicPoint(x, y,-1));
                    let [x1,y1] = this.oscFunction.calcHandleAbs(basics[i], this.oscFunction.handles[i], basics[i+1]);
                    handles.push(new HandlePoint(x1, y1, this.oscFunction.handles[i].xl, this.oscFunction.handles[i].yl));
                } else if (this.drugged==i){
                    basics.push(this.oscFunction.basics[i+1]);
                    let [x1,y1] = this.oscFunction.calcHandleAbs(basics[i], this.oscFunction.handles[i], basics[i+1]);
                    handles.push(new HandlePoint(x1, y1, this.oscFunction.handles[i].xl, this.oscFunction.handles[i].yl));
                } else {
                    basics.push(this.oscFunction.basics[i+1]);
                    handles.push(this.oscFunction.handles[i]);
                }
            }
        } else {
            for (let i=0; i<this.oscFunction.handles.length; i++){
                basics.push(this.oscFunction.basics[i+1]);
                handles.push(this.oscFunction.handles[i]);
            }
            if (this.drugged == 0){
                let [x1,y1] = this.oscFunction.calcHandleAbs(basics[0], this.oscFunction.handles[0], basics[1]);
                handles[0] = new HandlePoint(x1,y1,this.oscFunction.handles[0].xl,this.oscFunction.handles[0].yl);
            }
        }
        this.renderTest(basics, handles);
        this.renderAxes();
        if (this.render_handles){
            this.renderBetween(basics, handles)
        }
        this.renderFunction(basics, handles);
        if (this.render_handles){
            this.renderHandles(handles);
        }
        this.renderBasics(basics);
        this.renderChosen(x,-y);
    }
    renderFunction(basics:BasicPoint[], handles:HandlePoint[]){
        this.ctx.beginPath();
        this.ctx.moveTo(basics[0].x*this.width, -basics[0].y*this.height/2);
        
        this.ctx.strokeStyle = 'yellow';
        this.ctx.lineWidth = 4;
        let i = 0;
        for (let handle of handles) {
            const basic = basics[i+1];
            this.ctx.quadraticCurveTo(handle.x*this.width, -handle.y*this.height/2, basic.x*this.width, -basic.y*this.height/2);
            i++;
        };
        this.ctx.stroke();
        this.ctx.closePath();
    }
    renderBasics(basics:BasicPoint[]){
        for (let basic of basics) {
            this.ctx.beginPath();
            this.ctx.arc(basic.x*this.width, -basic.y*this.height/2, 6, 0, 2*Math.PI);
            this.ctx.fillStyle = 'red';
            this.ctx.fill();
            this.ctx.closePath();
        }
    }
    renderHandles(handles:HandlePoint[]){
        for (let handle of handles) {
            this.ctx.beginPath();
            this.ctx.arc(handle.x*this.width, -handle.y*this.height/2, 6, 0, 2*Math.PI);
            this.ctx.fillStyle = 'rgb(0,160,255)';
            this.ctx.fill();
            this.ctx.closePath();
        };
    }
    renderBetween(basics:BasicPoint[], handles:HandlePoint[]){
        for (let i=0; i<this.oscFunction.handles.length; i++){
            this.ctx.beginPath();
            this.ctx.moveTo(handles[i].x*this.width, -handles[i].y*this.height/2);
            this.ctx.lineTo(basics[i].x*this.width, -basics[i].y*this.height/2);
            this.ctx.moveTo(handles[i].x*this.width, -handles[i].y*this.height/2);
            this.ctx.lineTo(basics[i+1].x*this.width, -basics[i+1].y*this.height/2);
            this.ctx.strokeStyle = 'rgb(0,100,255)';
            this.ctx.lineWidth = 2.5;
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }
    renderAxes(){
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, this.height/2);
        this.ctx.lineTo(this.width, this.height/2);
        this.ctx.lineTo(this.width, -this.height/2);
        this.ctx.lineTo(0, -this.height/2);
        this.ctx.lineTo(0, 0);
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = 'white';
        this.ctx.stroke();
        this.ctx.closePath();

        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, -this.height/2);
        this.ctx.lineTo(0, this.height/2);
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(this.width, 0);
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = 'red';
        this.ctx.stroke();
        this.ctx.closePath();

        let n = 8;
        for (let i=1; i<n; i++){
            // if (i%2==0){
            //     this.ctx.beginPath();
            //     this.ctx.strokeStyle = 'grey';
            //     this.ctx.moveTo(i*this.width/n, -this.height/2);
            //     this.ctx.lineTo(i*this.width/n, this.height/2);
            //     this.ctx.closePath();
            // }
            this.ctx.beginPath();
            this.ctx.strokeStyle = 'red';
            this.ctx.moveTo(i*this.width/n, -5);
            this.ctx.lineTo(i*this.width/n, 5);
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.fillStyle = 'white';
            this.ctx.fillText((i/n).toString(), i*this.width/n-10, 20);
            this.ctx.closePath();
        }
        let t = 2
        for (let i=1; i<t+1; i++){
            this.ctx.beginPath();
            this.ctx.moveTo(-5, -i*this.height/t/2);
            this.ctx.lineTo(5, -i*this.height/t/2);
            this.ctx.moveTo(-5, i*this.height/t/2);
            this.ctx.lineTo(5, i*this.height/t/2);
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = 'red';
            this.ctx.stroke();
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(`${i/t}`, -20, -i*this.height/t/2+5);
            this.ctx.fillText(`${-i/t}`, -25, i*this.height/t/2+5);
            this.ctx.closePath();
        }

    }
    renderChosen(x:number,y:number){
        if (!this.chosenPoint) return;
        this.ctx.beginPath();
        if (this.drugged==-1){
            x = this.chosenPoint.x;
            y = -this.chosenPoint.y;
        }
        this.ctx.arc(x*this.width, y*this.height/2, 6, 0, 2*Math.PI);
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = 'yellow';
        this.ctx.stroke();
        this.ctx.closePath();

        this.ctx.beginPath();
        this.ctx.fillStyle = 'yellow';
        this.ctx.fillText(`${x.toFixed(2)}, ${-y.toFixed(2)}`, x*this.width+5, y*this.height/2-5);
        this.ctx.closePath();
    }
    renderTest(basics:BasicPoint[], handles:HandlePoint[]){
        let n = 64;
        for (let i=1; i<n; i++){
            this.ctx.beginPath();
            this.ctx.moveTo(i*this.width/n, 0);
            this.ctx.lineTo(i*this.width/n, -this.oscFunction.getSample(i/n,basics,handles)*this.height/2);
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = 'yellow';
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }

    processInput(x:number, y:number){
        x = (x - this.margin_left/this.canvas.width) * this.canvas.width/this.width;
        y = -y*this.canvas.height/this.height*2;
        return [x,y];
    }
    doubleInput(x:number, y:number){
        [x,y] = this.processInput(x,y);
        if (this.chosenPoint!=null){
            if (this.chosenPoint instanceof BasicPoint && this.chosenPoint.x_move && this.chosenPoint.y_move){
                let points = this.oscFunction.getAroundPoints(this.chosenPoint);
                this.commandPattern.addCommand(new Delete(this.oscFunction, points));
            } else if (this.chosenPoint instanceof HandlePoint){
                if (this.chosenPoint.xl == 0.5 && this.chosenPoint.yl == 0.5){
                    this.addPoint(this.chosenPoint.x,this.chosenPoint.y);
                } else {
                    this.chosenPoint.xl = 0.5;
                    this.chosenPoint.yl = 0.5;
                    [x,y] = this.oscFunction.getHandleDelta(this.chosenPoint);
                    this.commandPattern.addCommand(new Move(this.oscFunction,[this.chosenPoint],[x,y]));
                }
            }
            this.chosenPoint=null;
        } else {
            this.addPoint(x, y);
        } 
        this.findPoint(x, y, 0.06);
        this.render();
    }
    addPoint(x:number, y:number){
        if (x > 0 && x < 1 && y > -1 && y < 1){
            this.commandPattern.addCommand(new Create(this.oscFunction,[new BasicPoint(x, y, -1)]));
            this.render();
        }
    }
    findPoint(x:number, y:number, range:number){
        let flag = true; 
        for (let point of this.oscFunction.handles){
            if (point.getLength(x,y) <= range && (flag || (this.chosenPoint && point.getLength(x,y)<this.chosenPoint.getLength(x,y)))){
                this.chosenPoint = point;
                flag = false;
            }
        }
        for (let point of this.oscFunction.basics){
            if (point.getLength(x,y) <= range && (flag || (this.chosenPoint && point.getLength(x,y)<this.chosenPoint.getLength(x,y)))){
                this.chosenPoint = point;
                flag = false;
            }
        } 
        if (flag) this.chosenPoint = null;
    }
}