import { InputSignal } from "../classes/Input";
import { OutputSignal } from "../classes/Output";
import View from "../drawers/view";
import Node from "./node";
import Switch from "./node_components/switcher";

export default class InvertNode extends Node {
    active:Switch = new Switch(this, true)
    constructor(x:number, y:number, id:number, ){
        super(id, x, y, 70, 70, 'Invert');
        this.components.push(this.active)
        this.inputs = [new InputSignal('in', 0, 0, 0, this)]
        this.outputs = [new OutputSignal('out', 0, 0, this)]
    }
    render(view:View){
        this._render(view);
    }
    findByFullID(fullID:string) {
        if (fullID.length==0) return this;
        return null;
    }
    compute(){
        let c = this.inputs[0].get()
        if (this.active.bool) {
            if (c<0) c = -1+c;
            else if (c>=0) c = 1-c;
        }
        this.outputs[0].cache = c
    }
    returnJSON() {
        return {
            ...super.returnJSON()
        };
    }
    static fromJSON(json: any): InvertNode {
        const node = new InvertNode(json.x, json.y, json.id);
        return node;
    }
}