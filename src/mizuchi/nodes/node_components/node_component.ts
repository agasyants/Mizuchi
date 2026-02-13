import View from "../../drawers/view";
import Node from "../node";

export default abstract class NodeComponent {
    abstract isMoveble:boolean
    constructor(public node:Node, public x:number, public y:number, public width:number, public height:number){
        console.log('ok')
    }
    abstract render(view:View):void
    abstract hitScan(x:number, y:number, r:number):boolean
    abstract click():void
    abstract move(x:number,y:number):void
}