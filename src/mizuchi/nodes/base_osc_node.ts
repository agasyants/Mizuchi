import { InputMultiFloat } from "../classes/Input";
import { OutputSignal } from "../classes/Output";
import { mix } from "../data/mix";
import View from "../drawers/view";
import Node from "../nodes/node";

export default class BaseOscNode extends Node {
    constructor(x:number, y:number, id:number){
        super(id, x, y, 200, 100, "base osc");
        this.inputs = [new InputMultiFloat('in', 0, 0, 0, this)];
        this.outputs = [new OutputSignal("signal", 0, 0, this)];
    }
    render(view:View){
        this._render(view);
    }
    findByFullID(fullID:string) {
        if (fullID.length==0) return this;
        return null;
    }
    compute() {
        const founded:number[] = this.inputs[0].get()
        if (founded.length == 0) return 0;
        let sum:number = 0;
        for (let t of founded){
            sum += Math.sin((mix.playback) % t / t);
        }
        if (this.inputs.length>0) sum /= this.inputs.length;
        
        this.outputs[0].cache = sum;
    }
    returnJSON() {
        return {
            ...super.returnJSON()
        }; 
    }
    static fromJSON(json:any): BaseOscNode {
        const node = new BaseOscNode(json.x, json.y, json.id);
        
        return node;
    }
}