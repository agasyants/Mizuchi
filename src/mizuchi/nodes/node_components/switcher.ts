import View from "../../drawers/view";
import Node from "../node";
import NodeComponent from "./node_component";

export default class Switch extends NodeComponent {
    isMoveble: boolean = false;
    constructor(node:Node, public bool:boolean = true){
        super(node, 0, 0, 0.2, 0.2)
    }
    render(view:View){
        const color = view.getColor(this);
        let [rx, ry] = this.node.correctPos(this.x, this.y)
        let r = Math.sqrt(view.calcDim(this.width))
        let [rw, rh] = this.node.correctSize(this.width, this.height)
        view.drawCircle(rx+rw/2, ry-rh/2, r*12, color, false, 2)
        if (this.bool) {
            view.drawCircle(rx+rw/2, ry-rh/2, r*8, "yellow")
        }
    }
    hitScan(x:number, y:number, r:number):boolean {
        if (this.x < x && x < this.x + this.width && this.y < y && y < this.y + this.height) {
            console.log(r)
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