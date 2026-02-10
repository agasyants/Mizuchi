import View from "../drawers/view";
import Node from "./node";
import NodeSpace from "./node_space";

export default class InputNode extends Node {
    constructor(x:number, y:number, id:number, parent:NodeSpace){
        super(id, x, y, 100, 50, "Input Node", parent);
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
    static fromJSON(json: any, parent: any): InputNode {
        const node = new InputNode(json.x, json.y, json.id, parent);
        
        return node;
    }
    compute(){
        this.outputs[0].cache = this.inputs[0].get();
    }
}