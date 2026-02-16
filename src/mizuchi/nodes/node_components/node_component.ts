import View from "../../drawers/view";
import Node from "../node";

export default abstract class NodeComponent {
    abstract isMoveble:boolean
    abs:{x:number,y:number,w:number,h:number} = {x:0,y:0,w:0,h:0}
    rel:{x:number,y:number,w:number,h:number}
    constructor(public node:Node, x:number, y:number, width:number, height:number){
        this.rel = {x:x, y:y, w:width, h:height}
        console.log('ok')
    }
    correct_abs():void{
        [this.abs.x, this.abs.y] = this.node.correctPos(this.rel.x, -this.rel.y);
        [this.abs.w, this.abs.h] = this.node.correctSize(this.rel.w, this.rel.h);
    }
    abstract render(view:View):void
    abstract hitScan(x:number, y:number, r:number):boolean
    abstract click():void
    abstract move(x:number,y:number):void
}