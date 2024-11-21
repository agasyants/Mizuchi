export default class ScoreDrawer{
    w:number;
    h:number;
    margin_top:number;
    margin_left:number;
    width:number;
    height:number;
    ctx:CanvasRenderingContext2D;

    constructor(public canvas:HTMLCanvasElement){
        this.w = this.canvas.width = canvas.width * devicePixelRatio;
        this.h = this.canvas.height = canvas.height * devicePixelRatio;
        this.canvas.style.width = canvas.width / devicePixelRatio + 'px';
        this.canvas.style.height = canvas.height / devicePixelRatio + 'px';
        this.ctx = canvas.getContext('2d') || new CanvasRenderingContext2D();
        this.ctx.translate(0, this.h)
        this.margin_top = canvas.height/20;
        this.margin_left = this.margin_top;
        this.width = this.w - 2*this.margin_left;
        this.height = this.h - 2*this.margin_top;
    }
}