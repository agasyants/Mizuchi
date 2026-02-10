import View from "../drawers/view";
import MixNode from "../nodes/mix_node";
import Node from "../nodes/node";
import Connector from "./connectors";
import IdComponent from "./id_component";

export default abstract class Input extends IdComponent {
    parent: Node = new MixNode(0,0,0);
    connected: Connector|null = null;
    static getSeparator(){ return 'i';}
    constructor(public name:string, id:number, public x:number, public y:number) {
        super(id, Input.getSeparator(), parent);
    }
    abstract get():any
    hitScan(x:number, y:number, r:number):boolean {
        return Math.abs(this.x-x) < r && Math.abs(this.y-y) < r;
    }
    render(view:View){
        view.drawPin(this.x, this.y, 4, 1, view.color.back, view.getColor(this));
    }
    linkParent(p:Node){
        this.parent = p
    }
}

export class InputSignal extends Input{
    connected: Connector|null = null;
    constructor(name:string, id:number, x:number, y:number) {
        super(name, id, x, y);
    }
    returnJSON() {
        return { };
    }
    findByFullID(fullID: string) {
        if (fullID.length==0) return this;
        return null;
    }
    get():number{
        if (this.connected == null) return 0;
        return this.connected.get();
    }
}
