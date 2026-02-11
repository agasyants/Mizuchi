import View from "../../drawers/view";
import Node from "../node";
import NodeComponent from "./node_component";

export default class SignalController extends NodeComponent {
    n:number = 0.5
    rotation:number = 0.0
    isMoveble: boolean = true;
    constructor(node:Node){
        super(node, 0, 0, 0.4, 0.4)
    }
    render(view:View){
        const color = view.getColor(this);
        let [rx, ry] = this.node.correctPos(this.x, this.y)
        let r = Math.sqrt(view.calcDim(this.width))
        let [rw, rh] = this.node.correctSize(this.width, this.height)
        view.drawCircle(rx+rw/2, ry-rh/2, r*12, color, false, 2)
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
        console.error('Error')
    }
}