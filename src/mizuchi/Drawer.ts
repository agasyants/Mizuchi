export default abstract class Drawer{
    w:number=0;
    h:number=0;
    margin_top:number=0;
    margin_left:number=0;
    ctx:CanvasRenderingContext2D;

    constructor(public canvas:HTMLCanvasElement){
        this.ctx = canvas.getContext('2d') || new CanvasRenderingContext2D();
    }
    abstract render():void
    setCanvasSize(width:number, height:number):void{
        this.w = this.canvas.width = width * devicePixelRatio;
        this.h = this.canvas.height = height * devicePixelRatio;        
        this.canvas.style.width = this.canvas.width / devicePixelRatio + 'px';
        this.canvas.style.height = this.canvas.height / devicePixelRatio + 'px';
        this.margin_top = this.canvas.height/20;
        this.margin_left = this.margin_top;
    }

}