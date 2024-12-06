export default abstract class Drawer{
    w:number=0;
    h:number=0;
    margin_top:number=0;
    margin_left:number=0;
    ctx:CanvasRenderingContext2D;
    stopRender:boolean = false;

    constructor(public canvas:HTMLCanvasElement){
        this.ctx = canvas.getContext('2d') || new CanvasRenderingContext2D();
    }
    abstract render():void
    setCanvasSize(width:number, height:number, k:number=20):void{
        this.w = this.canvas.width = width * devicePixelRatio;
        this.h = this.canvas.height = height * devicePixelRatio;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        this.margin_top = this.canvas.height/k;
        this.margin_left = this.margin_top;
    }
}