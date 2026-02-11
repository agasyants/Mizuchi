import { InputSignal } from "../classes/Input";
import { OutputSignal } from "../classes/Output";
import View from "../drawers/view";
import Node from "./node";

export default class DelayNode extends Node {
    windowLenght = 44100;
    window:number[] = []
    constructor(x:number, y:number, id:number){
        super(id, x, y, 70, 70, 'Delay');
        this.window.fill(0, 0, this.windowLenght)
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
        this.window.push(this.inputs[0].get());
        this.outputs[0].cache = this.window.shift();
    }
    returnJSON() {
        return {
            ...super.returnJSON(),
            windowLenght: this.windowLenght
        };
    }
    static fromJSON(json: any): DelayNode {
        const node = new DelayNode(json.x, json.y, json.id);
        
        node.windowLenght = json.windowLenght;
        return node;
    }
}