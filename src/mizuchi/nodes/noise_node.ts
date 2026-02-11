import { OutputSignal } from "../classes/Output";
import View from "../drawers/view";
import Node from "./node";

export default class NoiseNode extends Node {
    constructor(x:number, y:number, id:number){
        super(id, x, y, 90, 90, 'White Noise');
        this.inputs = []
        this.outputs = [new OutputSignal("out", 0, 0, this)]
    }
    render(view:View){
        // console.log(view);
        this._render(view);
    }
    findByFullID(fullID:string) {
        if (fullID.length==0) return this;
        return null;
    }
    compute(){
        this.outputs[0].cache = Math.random()*2-1.0
    }
    static fromJSON(json: any): NoiseNode {
        const node = new NoiseNode(json.x, json.y, json.id);
        return node;
    }
}