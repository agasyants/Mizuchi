import { InputSignal } from "../classes/Input";
import { OutputSignal } from "../classes/Output";
import View from "../drawers/view";
import Node from "./node";
import ControlController from "./node_components/control_controller";
import Switch from "./node_components/switcher";

export default class DistortionNode extends Node {
    gain:ControlController = new ControlController(this)
    input_signal:InputSignal = new InputSignal('in',0,0,0,this)
    output_signal:OutputSignal = new OutputSignal('in',0,0,this)
    constructor(x:number, y:number, id:number, ){
        super(id, x, y, 70, 70, 'Distortion');
        this.inputs = [this.input_signal]
        this.outputs = [this.output_signal]
        this.components = [new Switch(this), this.gain]
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
        let c = this.inputs[0].get() * (1 + this.gain.dry*4)
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