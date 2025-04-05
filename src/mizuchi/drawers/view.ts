export default class View {
    constructor(public ctx:CanvasRenderingContext2D){
    }
    width:number = 0;
    height:number = 0;
    center:{x:number, y:number} = {x:0, y:0};
    scale:number = 1;
    down:{x:number, y:number} = {x:0, y:0};
    calcX(x:number):number {
        return (x + this.center.x) * this.scale;
    }
    calcY(y:number):number {
        return (y + this.center.y) * this.scale;
    }
    calcDim(dim:number):number {
        return dim * this.scale;
    }
    zoom(delta:number, was:[x:number,y:number]){
        delta = this.scale*delta/2;
        if (this.scale-delta < 0.3 || this.scale-delta > 14) return;
        // this.calcCenter(0.5+(was[0]-0.5)*delta, 0.5+(was[1]-0.5)*delta);
        // this.calcCenter(this.center.x-was[0]*delta, this.center.y-was[1]*delta);
        console.log(this.center.x-was[0]*delta, this.center.y-was[1]*delta);
        this.scale -= delta;
    }
    calcCenter(x:number, y:number){
        this.center.x = (this.down.x + x) / this.scale * 1.5;
        this.center.y = (this.down.y + y) / this.scale * 1.5;
    }
    calcDown(x:number, y:number){
        this.down.x = this.center.x * this.scale / 1.5 - x;
        this.down.y = this.center.y * this.scale / 1.5 - y;
    }
    setSize(w:number,h:number){
        this.width = w;
        this.height = h;
    }
    drawSquare(x:number, y:number, width:number, height:number, color:string, radius:number=0, fill:boolean=true){
        const x1 = this.calcX(x);
        const y1 = this.calcY(y);
        const w = this.calcDim(width);
        const h = this.calcDim(height);
        this.ctx.beginPath();
        this.ctx.moveTo(x1+this.width/2, -y1-this.height/2);
        this.ctx.arcTo(x1+this.width/2+w, -y1-this.height/2, x1+this.width/2+w, -y1-this.height/2+h, radius);
        this.ctx.arcTo(x1+this.width/2+w, -y1-this.height/2+h, x1+this.width/2, -y1-this.height/2+h, radius);
        this.ctx.arcTo(x1+this.width/2, -y1-this.height/2+h, x1+this.width/2, -y1-this.height/2, radius);
        this.ctx.arcTo(x1+this.width/2, -y1-this.height/2, x1+this.width/2+w, -y1-this.height/2, radius);
        this.ctx.closePath();
        if (fill) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.strokeStyle = color;
            this.ctx.stroke();
        }
    }
    drawPin(x:number, y:number, radius:number, border:number, colorIn:string, colorOut:string){
        this.drawCircle(x, y, radius+border, colorOut);
        this.drawCircle(x, y, radius-border, colorIn);
    }
    drawCircle(x:number, y:number, radius:number, color:string, fill:boolean=true){
        const x1 = this.calcX(x);
        const y1 = this.calcY(y);
        const r = radius*Math.pow(this.scale, 0.5)*1.1;
        this.ctx.beginPath();
        this.ctx.arc(x1+this.width/2, -y1-this.height/2, r, 0, 2*Math.PI);
        if (fill) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.strokeStyle = color;
            this.ctx.stroke();
        }
        this.ctx.closePath();
    }
    drawFrame(x:number, y:number, width:number, height:number, border:number, mainColor:string, frameColor:string, radius:number=0){
        border/=this.scale;
        this.drawSquare(x-border, y+border, width+border*2, height+border*2, mainColor, radius*2);
        this.drawSquare(x+border, y-border, width-border*2, height-border*2, frameColor, radius);
    }
    drawText(x:number, y:number, max_width:number, max_height:number, text:string){
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = String(Math.min(max_width, max_height)*this.scale)+'px Arial';
        this.ctx.scale(1, -1);
        this.ctx.fillText(text, x+this.width/2, y-this.height/3);
        this.ctx.scale(1, -1);
    }
    drawLine(x1:number, y1:number, x2:number, y2:number, width:number, color:string){
        this.ctx.beginPath();
        this.ctx.moveTo(this.calcX(x1)+this.width/2, -this.calcY(y1)-this.height/2);
        this.ctx.lineTo(this.calcX(x2)+this.width/2, -this.calcY(y2)-this.height/2);
        this.ctx.lineWidth = width;
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
        this.ctx.closePath();
    }
}