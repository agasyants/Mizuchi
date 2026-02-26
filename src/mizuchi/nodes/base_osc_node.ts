import { InputMultiFloat } from "../classes/Input";
import { OutputSignal } from "../classes/Output";
import Mix from "../data/mix";
import View from "../drawers/view";
import Node from "../nodes/node";

export default class BaseOscNode extends Node {
    mix:Mix;
    constructor(x:number, y:number, mix:Mix, id:number){
        super(id, x, y, 100, 150, "NOTE INPUT");
        this.inputs = [new InputMultiFloat('in', 0, 0, 0, this)];
        this.outputs = [new OutputSignal("signal", 0, 0, this)];
        this.mix = mix;
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
            sum += Math.sin((this.mix.playback) % t / t);
        }
        if (this.inputs.length>0) sum /= this.inputs.length;
        // console.log('NoteInput', sum)
        this.outputs[0].cache = sum;
    }
    returnJSON() {
        return {
            ...super.returnJSON()
        }; 
    }
    static fromJSON(json:any, mix:Mix): BaseOscNode {
        const node = new BaseOscNode(json.x, json.y, mix, json.id);
        
        return node;
    }
}