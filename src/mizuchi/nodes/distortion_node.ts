import View from "../drawers/view";
import Node from "./node";

export default class DistortionNode extends Node {
    constructor(x:number, y:number, id:number, ){
        super(id, x, y, 70, 70, ['input'], 'Distortion');
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
        const c = this.inputs[0].get() * 5
        if (c<-1) return -1;
        else if (c>1) return 1;
        else return c;
    }
    returnJSON() {
        return {
            ...super.returnJSON()
        };
    }
    static fromJSON(json: any): DistortionNode {
        const node = new DistortionNode(json.x, json.y, json.id);
        return node;
    }
}