import OscFunction, { Point } from "./osc_function";

export default class OscDrawer{
    chosenPoint:Point|null = null;
    drugged:boolean = false;
    render_handles:boolean = false;
    w:number;
    h:number;
    margin_top:number;
    margin_left:number;
    width:number;
    height:number;
    oscCtx:CanvasRenderingContext2D;
    constructor(public oscCanvas:HTMLCanvasElement, public oscFunction:OscFunction){

        this.w = this.oscCanvas.width = oscCanvas.width * devicePixelRatio;
        this.h = this.oscCanvas.height = oscCanvas.height * devicePixelRatio;
        this.oscCanvas.style.width = oscCanvas.width / devicePixelRatio + 'px';
        this.oscCanvas.style.height = oscCanvas.height / devicePixelRatio + 'px';
      
        this.oscCtx = oscCanvas.getContext('2d') || new CanvasRenderingContext2D();
        this.margin_top = oscCanvas.height/16;
        this.margin_left = this.margin_top;
        this.width = (this.w - 2*this.margin_left);
        this.height = (this.h - 2*this.margin_top);
        this.oscCtx?.translate(this.margin_left, this.h/2);

        oscCanvas.onselectstart = function () { return false; }
        oscCanvas.addEventListener('dblclick', (e) => {
            const rect = oscCanvas.getBoundingClientRect();
            const x = (e.clientX - rect.left)/rect.width;
            const y = (e.clientY - rect.top)/rect.height-0.5;
            this.doubleInput(x,y);
            this.render();
        });
        oscCanvas.addEventListener('pointermove', (e) => {
            const rect = oscCanvas.getBoundingClientRect();
            const x = (e.clientX - rect.left)/rect.width;
            const y = (e.clientY - rect.top)/rect.height-0.5;
            this.findPoint(x,y,0.06);
            this.render();
        });
        oscCanvas.addEventListener('pointerdown', () => {
            if (this.chosenPoint){
                this.drugged = true;}
        });
        oscCanvas.addEventListener('pointerup', () => {
            this.drugged = false;
        });
        oscCanvas.addEventListener('pointerleave', () => {
            this.render_handles = false;
            this.chosenPoint = null;
            this.render();
        });
        oscCanvas.addEventListener('pointerover', () => {
            this.render_handles = true;
        });

        this.render()
    }
    render() {
        this.oscCtx.clearRect(-this.margin_left, -this.h/2, this.w, this.h);
        this.oscCtx.font = "14px system-ui";
        this.renderTest();
        this.renderAxes();
        if (this.render_handles){
            this.renderBetween()
        }
        this.renderFunction();
        if (this.render_handles){
            this.renderHandles();
        }
        this.renderBasics();
        this.renderChosen();
        
    }

    renderFunction(){
        this.oscCtx.beginPath();
        this.oscCtx.moveTo(0, 0);
        this.oscCtx.strokeStyle = 'yellow';
        this.oscCtx.lineWidth = 4;
        let i = 0;
        this.oscFunction.handles.forEach((handle) => {
            const basic = this.oscFunction.basics[i+1];
            this.oscCtx.quadraticCurveTo(handle.x*this.width, -handle.y*this.height/2, basic.x*this.width, -basic.y*this.height/2);
            i++;
        });
        this.oscCtx.stroke();
        this.oscCtx.closePath();
    }

    renderBasics(){
        this.oscFunction.basics.forEach(point => {
            this.oscCtx.beginPath();
            this.oscCtx.arc(point.x*this.width, -point.y*this.height/2, 6, 0, 2*Math.PI);
            this.oscCtx.fillStyle = 'red';
            this.oscCtx.fill();
            this.oscCtx.closePath();
        });
    }

    renderHandles(){
        this.oscFunction.handles.forEach((point) => {
            this.oscCtx.beginPath();
            this.oscCtx.arc(point.x*this.width, -point.y*this.height/2, 6, 0, 2*Math.PI);
            this.oscCtx.fillStyle = 'rgb(0,160,255)';
            this.oscCtx.fill();
            this.oscCtx.closePath();
        });
    }

    renderBetween(){
        for (let i=0; i<this.oscFunction.handles.length; i++){
            this.oscCtx.beginPath();
            this.oscCtx.moveTo(this.oscFunction.handles[i].x*this.width, -this.oscFunction.handles[i].y*this.height/2);
            this.oscCtx.lineTo(this.oscFunction.basics[i].x*this.width, -this.oscFunction.basics[i].y*this.height/2);
            this.oscCtx.moveTo(this.oscFunction.handles[i].x*this.width, -this.oscFunction.handles[i].y*this.height/2);
            this.oscCtx.lineTo(this.oscFunction.basics[i+1].x*this.width, -this.oscFunction.basics[i+1].y*this.height/2);
            this.oscCtx.strokeStyle = 'rgb(0,160,255)';
            this.oscCtx.lineWidth = 1;
            this.oscCtx.stroke();
            this.oscCtx.closePath();
        }
    }

    renderAxes(){
        this.oscCtx.beginPath();
        this.oscCtx.moveTo(0, 0);
        this.oscCtx.lineTo(0, this.height/2);
        this.oscCtx.lineTo(this.width, this.height/2);
        this.oscCtx.lineTo(this.width, -this.height/2);
        this.oscCtx.lineTo(0, -this.height/2);
        this.oscCtx.lineTo(0, 0);
        this.oscCtx.lineWidth = 2;
        this.oscCtx.strokeStyle = 'white';
        this.oscCtx.stroke();
        this.oscCtx.closePath();

        this.oscCtx.beginPath();
        this.oscCtx.moveTo(0, 0);
        this.oscCtx.lineTo(0, -this.height/2);
        this.oscCtx.lineTo(0, this.height/2);
        this.oscCtx.moveTo(0, 0);
        this.oscCtx.lineTo(this.width, 0);
        this.oscCtx.lineWidth = 3;
        this.oscCtx.strokeStyle = 'red';
        this.oscCtx.stroke();
        this.oscCtx.closePath();

        let n = 8;
        for (let i=1; i<n; i++){
            // if (i%2==0){
            //     this.oscCtx.beginPath();
            //     this.oscCtx.strokeStyle = 'grey';
            //     this.oscCtx.moveTo(i*this.width/n, -this.height/2);
            //     this.oscCtx.lineTo(i*this.width/n, this.height/2);
            //     this.oscCtx.closePath();
            // }
            this.oscCtx.beginPath();
            this.oscCtx.strokeStyle = 'red';
            this.oscCtx.moveTo(i*this.width/n, -5);
            this.oscCtx.lineTo(i*this.width/n, 5);
            this.oscCtx.lineWidth = 2;
            this.oscCtx.stroke();
            this.oscCtx.fillStyle = 'white';
            this.oscCtx.fillText((i/n).toString(), i*this.width/n-10, 20);
            this.oscCtx.closePath();
        }
        let t = 2
        for (let i=1; i<t+1; i++){
            this.oscCtx.beginPath();
            this.oscCtx.moveTo(-5, -i*this.height/t/2);
            this.oscCtx.lineTo(5, -i*this.height/t/2);
            this.oscCtx.moveTo(-5, i*this.height/t/2);
            this.oscCtx.lineTo(5, i*this.height/t/2);
            this.oscCtx.lineWidth = 2;
            this.oscCtx.strokeStyle = 'red';
            this.oscCtx.stroke();
            this.oscCtx.fillStyle = 'white';
            this.oscCtx.fillText(`${i/t}`, -20, -i*this.height/t/2+5);
            this.oscCtx.fillText(`${-i/t}`, -25, i*this.height/t/2+5);
            this.oscCtx.closePath();
        }

    }

    renderChosen(){
        if (!this.chosenPoint) return;
        this.oscCtx.beginPath();
        let x = this.chosenPoint.x;
        let y = -this.chosenPoint.y;
        this.oscCtx.arc(x*this.width, y*this.height/2, 6, 0, 2*Math.PI);
        this.oscCtx.lineWidth = 2;
        this.oscCtx.strokeStyle = 'yellow';
        this.oscCtx.stroke();
        this.oscCtx.closePath();

        this.oscCtx.beginPath();
        this.oscCtx.fillStyle = 'yellow';
        this.oscCtx.fillText(`${this.chosenPoint.x.toFixed(2)}, ${this.chosenPoint.y.toFixed(2)}`, this.chosenPoint.x*this.width+5, -this.chosenPoint.y*this.height/2-5);
        this.oscCtx.closePath();
    }

    renderTest(){
        let n = 64;
        for (let i=1; i<n; i++){
            this.oscCtx.beginPath();
            this.oscCtx.moveTo(i*this.width/n, 0);
            this.oscCtx.lineTo(i*this.width/n, -this.oscFunction.getI(i/n)*this.height/2);
            this.oscCtx.lineWidth = 1;
            this.oscCtx.strokeStyle = 'yellow';
            this.oscCtx.stroke();
            this.oscCtx.closePath();
        }
    }

    processInput(x:number, y:number){
        x = (x - this.margin_left/this.oscCanvas.width) * this.oscCanvas.width/this.width;
        y = -y*this.oscCanvas.height/this.height*2;
        return [x,y];
    }
    doubleInput(x:number, y:number){
        [x,y] = this.processInput(x,y);
        if (this.chosenPoint!=null){
            if (this.oscFunction.basics.includes(this.chosenPoint)){
                this.oscFunction.removeBasicPoint(this.chosenPoint);
            } else {
                if (this.chosenPoint.xl == 0.5 && this.chosenPoint.yl == 0.5){
                    this.oscFunction.addBasicPoint(this.chosenPoint.x, this.chosenPoint.y);
                } else {
                    this.oscFunction.setDefaultHandle(this.oscFunction.handles.findIndex((e)=>(e==this.chosenPoint)));
                }
            }
            this.chosenPoint=null;
        } else {
            this.addPoint(x, y);
        }
    }
    addPoint(x:number, y:number){
        if (x > 0 && x < 1 && y > -1 && y < 1){
            this.oscFunction.addBasicPoint(x,y)
            this.render();
        }
    }
    findPoint(x:number, y:number, range:number){
        [x,y] = this.processInput(x,y);
        if (this.drugged && this.chosenPoint){
            this.oscFunction.move(this.chosenPoint, x, y);
            return;
        }
        for (let i = 0; i < this.oscFunction.handles.length; i++){
            if (Math.abs(this.oscFunction.handles[i].x - x) <= range && Math.abs(this.oscFunction.handles[i].y - y) <= range){
                this.chosenPoint = this.oscFunction.handles[i];
                return;
            }
        }
        for (let i = 1; i < this.oscFunction.basics.length-1; i++){
            if (Math.abs(this.oscFunction.basics[i].x - x) <= range && Math.abs(this.oscFunction.basics[i].y - y) <= range){
                this.chosenPoint = this.oscFunction.basics[i];
                return;
            }
        } 
        this.chosenPoint = null;
    }
}