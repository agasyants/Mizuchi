import { InputSignal } from "../classes/Input";
import View from "../drawers/view";
import Node from "./node";
import NodeSpace from "./node_space";

export default class OutputNode extends Node {
    constructor(x:number, y:number, id:number, parent:NodeSpace){
        super(id, x, y, 100, 50, 'Output', parent);
        this.inputs = [new InputSignal("in", 0, 0, 0)];
        this.outputs = [];
    }
    render(view:View){
        // console.log(view);
        this._render(view);
        // const x = view.calcX(this.x);
        // const y = view.calcY(this.y);
        // const w = view.calcDim(this.width);
        // const h = view.calcDim(this.height);
        // ctx.fillStyle = 'white';
        // ctx.fillRect(x, -y/2, w, h);
        // ctx.fillStyle = 'blue';
        // ctx.fillRect(x+5, -y/2+5, w-10, h-10);
        // ctx.fillStyle = 'white';
        // ctx.font = String(30*view.scale)+'px Arial';
        // ctx.scale(1, -1);
        // ctx.fillText(this.name, x+w/16,y+height/2-h/4);
        // ctx.scale(1, -1);
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