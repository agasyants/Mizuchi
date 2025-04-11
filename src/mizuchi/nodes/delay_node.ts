import View from "../drawers/view";
import Node from "./node";

export default class DelayNode extends Node {
    windowLenght = 44100;
    constructor(x:number, y:number, id:number, ){
        super(id, x, y, 70, 70, ['input'], 'Delay');
        this.window.fill(0, 0, this.windowLenght)
    }
    render(view:View){
        // console.log(view);
        this._render(view);
    }
    findByFullID(fullID:string) {
        if (fullID.length==0) return this;
        return null;
    }
    get(){
        this.window.push(this.inputs[0].get());
        return this.window.shift();
    }
    returnJSON() {
        return {
            ...super.returnJSON(),
            windowLenght: this.windowLenght
        };
    }
    static fromJSON(json: any): DelayNode {
        const node = new DelayNode(json.x, json.y, json.id);
        node.window = json.window;
        node.windowLenght = json.windowLenght;
        return node;
    }
}