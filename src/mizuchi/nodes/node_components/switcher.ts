import View from "../../drawers/view";
import Node from "../node";
import NodeComponent from "./node_component";

export default class Switch extends NodeComponent {
    constructor(node:Node, public bool:boolean = true){
        super(node,0,0,0.2,0.2)
    }
    render(view:View){
        let [rx, ry] = this.node.correctPos(this.x, this.y)
        let [rw, rh] = this.node.correctSize(this.width, this.height)
        let r = view.calcDim(rw)/2
        view.drawCircle(rx+rw/2, ry-rh/2, 4, "blue", false)
    }
    hitScan(x:number, y:number, r:number){
        
    }
}