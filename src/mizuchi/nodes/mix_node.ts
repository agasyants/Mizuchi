import { InputSignal } from "../classes/Input";
import { OutputSignal } from "../classes/Output";
import View from "../drawers/view";
import Node from "./node";
import ControlController from "./node_components/control_controller";

export default class MixNode extends Node {
    dryWet:ControlController = new ControlController(this)
    a_signal:InputSignal = new InputSignal('A', 0, 0, 0, this)
    b_signal:InputSignal = new InputSignal('B', 1, 0, 0, this)
    output:OutputSignal = new OutputSignal('out', 0, 0, this)

    constructor(x:number, y:number, id:number){
        super(id, x, y, 100, 80, 'MixNode');
        this.inputs = [this.a_signal, this.b_signal]
        this.outputs = [this.output]
        this.components.push(this.dryWet)
    }
    render(view:View){
        this._render(view);
    }
    findByFullID(fullID:string) {
        if (fullID.length==0) return this;
        return null;
    }
    compute(){
        this.outputs[0].cache = this.inputs[0].get()*this.dryWet.dry + this.inputs[1].get()*(1-this.dryWet.dry);
    }
    returnJSON() {
        return {
            ...super.returnJSON(),
            dryWet: this.dryWet
        };
    }
    static fromJSON(json: any): MixNode {
        const node = new MixNode(json.x, json.y, json.id);
        node.dryWet = json.dryWet;
        return node;
    }
}