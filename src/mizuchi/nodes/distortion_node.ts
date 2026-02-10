import View from "../drawers/view";
import Node from "./node";
import Switch from "./node_components/switcher";

export default class DistortionNode extends Node {
    constructor(x:number, y:number, id:number, ){
        super(id, x, y, 70, 70, 'Distortion');
        this.components.push(new Switch(this))
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
        let c = this.inputs[0].get() * 5
        if (c<-1) c = -1;
        else if (c>1) c = 1;
        this.outputs[0].cache = c
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