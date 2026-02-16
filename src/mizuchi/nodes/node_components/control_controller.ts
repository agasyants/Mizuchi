import View from "../../drawers/view";
import Node from "../node";
import NodeComponent from "./node_component";

export default class ControlController extends NodeComponent {
    dry:number = 0.5
    isMoveble: boolean = true;
    constructor(node:Node, x:number, y:number, r:number){
        super(node, x, y, r/node.width, r/node.height)
    }
    render(view:View){
        let color = view.getColor(this);
        if (color == "blue") {
            color = "yellow"
        }
        this.correct_abs()
        let rx = this.abs.x
        let ry = this.abs.y
        let r = this.abs.w/2

        view.drawCircle(rx, ry, r, color, false, 2)
        const angle = (this.dry - 0.5)*Math.PI*8/5
        const sinA = (-r)*Math.sin(angle)
        const cosA = r*Math.cos(angle)

        view.drawLine(rx-sinA, ry-cosA, rx-sinA/3, ry-cosA/3, 2, color)
    }
    hitScan(x:number, y:number, r:number):boolean {
        if (this.rel.x-this.rel.w/2 < x-r && x+r < this.rel.x + this.rel.w/2 && this.rel.y-this.rel.h/2 < y-r && y+r < this.rel.y + this.rel.h/2) {
            return true
        } else {
            return false
        }
    }
    click(): void {
        console.error('Error')
    }
    move(_x:number, y:number):void {
        this.dry -= y/200
        if (this.dry > 1) this.dry = 1
        if (this.dry < 0) this.dry = 0
    }
}