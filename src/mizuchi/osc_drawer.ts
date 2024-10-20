import OscFunction, { Point } from "./osc_function";

export default class OscDrawer{
    chosenPoint:Point|null = null;
    drugged:boolean = false;
    render_handles:boolean = true;
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
        this.margin_top = oscCanvas.height/10;
        this.margin_left = this.margin_top;
        this.width = (this.w - 2*this.margin_left);
        this.height = (this.h - 2*this.margin_top);
        this.oscCtx?.translate(this.margin_left, this.h/2);
        this.render()
    }
    render()
    {
        this.oscCtx.clearRect(-this.margin_left, -this.h/2, this.w, this.h);
        this.oscCtx.font = "20px system-ui";
        this.renderTest();
        this.renderAxes();
        if (this.render_handles){
            this.renderBetween()
            this.renderHandles();
        }
        this.renderFunction();
        this.renderBasics();
   
        this.renderChosen();
        
    }

    renderFunction(){
       
        this.oscCtx.beginPath();
        this.oscCtx.moveTo(0, 0);
        this.oscCtx.strokeStyle = 'rgb(0, 0, 0)';
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
            this.oscCtx.fillStyle = 'blue';
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
            this.oscCtx.strokeStyle = 'blue';
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
        this.oscCtx.strokeStyle = 'black';
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
            this.oscCtx.beginPath();
            this.oscCtx.moveTo(i*this.width/n, -5);
            this.oscCtx.lineTo(i*this.width/n, 5);
            this.oscCtx.lineWidth = 2;
            this.oscCtx.strokeStyle = 'red';
            this.oscCtx.stroke();
            this.oscCtx.fillStyle = 'red';
            this.oscCtx.fillText((i/n).toString(), i*this.width/n-10, 20);
            this.oscCtx.closePath();
        }
        let t = 4
        for (let i=1; i<t+1; i++){
            this.oscCtx.beginPath();
            this.oscCtx.moveTo(-5, -i*this.height/t/2);
            this.oscCtx.lineTo(5, -i*this.height/t/2);
            this.oscCtx.moveTo(-5, i*this.height/t/2);
            this.oscCtx.lineTo(5, i*this.height/t/2);
            this.oscCtx.lineWidth = 2;
            this.oscCtx.strokeStyle = 'red';
            this.oscCtx.stroke();
            this.oscCtx.fillStyle = 'red';
            this.oscCtx.fillText(`${i/t}`, -40, -i*this.height/t/2+5);
            this.oscCtx.fillText(`${-i/t}`, -45, i*this.height/t/2+5);
            this.oscCtx.closePath();
        }

    }

    renderChosen(){
        if (!this.chosenPoint) return;
        this.oscCtx.beginPath();
        let x = this.chosenPoint.x;
        let y = -this.chosenPoint.y;
        this.oscCtx.arc(x*this.width, y*this.height/2, 6, 0, 2*Math.PI);
        this.oscCtx.lineWidth = 3;
        this.oscCtx.strokeStyle = 'black';
        this.oscCtx.stroke();
        this.oscCtx.closePath();

        this.oscCtx.beginPath();

        this.oscCtx.fillStyle = 'black';
        this.oscCtx.fillText(`${x.toFixed(2)}, ${-y.toFixed(2)}`, this.chosenPoint.x*this.width+5, -this.chosenPoint.y*this.height/2-5);
        this.oscCtx.closePath();
    }

    renderTest(){
        let n = 64;
        for (let i=1; i<n; i++){
            this.oscCtx.beginPath();
            this.oscCtx.moveTo(i*this.width/n, 0);
            this.oscCtx.lineTo(i*this.width/n, -this.oscFunction.getI(i/n)*this.height/2);
            this.oscCtx.lineWidth = 1;
            this.oscCtx.strokeStyle = 'green';
            this.oscCtx.stroke();
            this.oscCtx.closePath();
        }
    }

    processInputX(x:number){
        x = (x - this.margin_left/this.oscCanvas.width) * this.oscCanvas.width/this.width;
        return x;
    }
    processInputY(y:number){
        y = -y*this.oscCanvas.height/this.height*2;
        return y;
    }
    doubleInput(x:number, y:number){
        x = this.processInputX(x);
        y = this.processInputY(y);
        if (this.chosenPoint!=null){
            if (this.oscFunction.basics.includes(this.chosenPoint)){
                this.oscFunction.removeBasicPoint(this.chosenPoint);
            } else {
                this.oscFunction.setDefaultHandle(this.oscFunction.handles.findIndex((e)=>(e==this.chosenPoint)));
            }
            this.chosenPoint=null;
        } else {
            this.addPoint(x, y);
        }
    }
    addPoint(x:number, y:number){
        if (x > 0 && x < 1 && y > -1 && y < 1){
            for (let i = 0; i < this.oscFunction.basics.length-1; i++){
                if (this.oscFunction.basics[i].x <= x && x <= this.oscFunction.basics[i+1].x){
                    this.oscFunction.addBasicPoint(new Point(x, y), i+1);
                    this.render();
                    return;
                }
            }
        }
    }
    findPoint(x:number, y:number, range:number){
        x = this.processInputX(x);
        y = this.processInputY(y);
        
        // console.log((this.oscFunction.basics[1].x - x)/(this.oscFunction.basics[1].x-this.oscFunction.basics[0].x), (this.oscFunction.basics[1].y - y)/(this.oscFunction.basics[1].y-this.oscFunction.basics[0].y));
        if (this.drugged && this.chosenPoint){
            this.oscFunction.move(this.chosenPoint, x, y);
            return;
        }
        if (x > 0 && x < 1 && y > -1 && y < 1){
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
}