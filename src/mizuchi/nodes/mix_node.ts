import { InputSignal } from "../classes/Input";
import { OutputSignal } from "../classes/Output";
import View from "../drawers/view";
import Node from "./node";
import SignalController from "./node_components/signal_controller";

export default class MixNode extends Node {
    dryWet:number = 0.5;
    constructor(x:number, y:number, id:number){
        super(id, x, y, 100, 80, 'MixNode');
        this.inputs = [new InputSignal('A', 0, 0, 0, this), new InputSignal('B', 1, 0, 0, this)]
        this.outputs = [new OutputSignal('out', 0, 0, this)]
        this.components.push(new SignalController(this))
    }
    render(view:View){
        this._render(view);
    }
    findByFullID(fullID:string) {
        if (fullID.length==0) return this;
        return null;
    }
    compute(){
        this.outputs[0].cache = this.inputs[0].get()*this.dryWet + this.inputs[1].get()*(1-this.dryWet);
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