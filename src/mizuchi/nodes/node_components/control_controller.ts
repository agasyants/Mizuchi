import View from "../../drawers/view";
import Node from "../node";
import NodeComponent from "./node_component";

export default class ControlController extends NodeComponent {
    dry:number = 0.5
    isMoveble: boolean = true;
    constructor(node:Node){
        super(node, 0, 0, 0.4, 0.4)
    }
    render(view:View){
        const color = view.getColor(this);
        let [rx, ry] = this.node.correctPos(this.x, this.y)
        let r = Math.sqrt(view.calcDim(this.width))
        let [rw, rh] = this.node.correctSize(this.width, this.height)
        rx += rw/2
        ry -= rh/2
        view.drawCircle(rx, ry, r*12, color, false, 2)
        const angle = (this.dry - 0.5)*2*Math.PI*2/3
        const sinA = (-r)*Math.sin(angle)*5
        const cosA = r*Math.cos(angle)*5

        view.drawCircle(rx-sinA*r, ry-cosA*r, r*5, color, true)

        console.log(this.dry, angle)
    }
    hitScan(x:number, y:number, r:number):boolean {
        if (this.x < x-r && x+r < this.x + this.width && this.y < y-r && y+r < this.y + this.height) {
            return true
        } else {
            return false
        }
    }
    click(): void {
        console.error('Error')
    }
    move(_x:number, y:number):void {
        this.dry -= y/60
        if (this.dry > 1) this.dry = 1
        if (this.dry < 0) this.dry = 0
    }
}