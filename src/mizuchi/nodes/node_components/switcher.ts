import View from "../../drawers/view";
import Node from "../node";
import NodeComponent from "./node_component";

export default class Switch extends NodeComponent {
    isMoveble: boolean = false;
    constructor(node:Node, public bool:boolean, x:number, y:number, r:number){
        super(node, x, y, r/node.width, r/node.height)
    }
    render(view:View){
        const color = view.getColor(this);
        this.correct_abs()
        let rx = this.abs.x
        let ry = this.abs.y
        let r = this.abs.w/2
        view.drawCircle(rx, ry, r, color, false, 2)
        if (this.bool) {
            view.drawCircle(rx, ry, r*0.8, "yellow")
        }
    }
    hitScan(x:number, y:number, r:number):boolean {
        if (this.rel.x-this.rel.w/2 < x-r && x+r < this.rel.x + this.rel.w/2 && this.rel.y-this.rel.h/2 < y-r && y+r < this.rel.y + this.rel.h/2) {
            return true
        } else {
            return false
        }
    }
    click(): void {
        this.bool = !this.bool
    }
    move(): void {
        console.error("error")
    }
}