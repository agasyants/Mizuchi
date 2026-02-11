import { InputSignal } from "../classes/Input";
import View from "../drawers/view";
import Node from "./node";
import NodeSpace from "./node_space";

export default class OutputNode extends Node {
    constructor(x:number, y:number, id:number, parent:NodeSpace){
        super(id, x, y, 100, 50, 'Output', parent);
        this.inputs = [new InputSignal("in", 0, 0, 0, this)];
        this.outputs = [];
    }
    render(view:View){
        this._render(view);
    }
    returnJSON() {
        return {
            ...super.returnJSON()
        };
    }
    findByFullID(fullID:string) {
        if (fullID.length==0) return this;
        return null;
    }
    static fromJSON(json: any, parent: any): OutputNode {
        const node = new OutputNode(json.x, json.y, json.id, parent);
        
        return node;
    }
    compute():number{
        return this.inputs[0].get();
    }
}