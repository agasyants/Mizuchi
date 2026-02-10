import { OutputSignal } from "../classes/Output";
import Mix from "../data/mix";
import View from "../drawers/view";
import Node from "./node";

export default class FromTrackNode extends Node {
    constructor(x:number, y:number, id:number, public mix:Mix){
        super(id, x, y, 90, 160, 'FromTrackNode');
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
        let sum = 0;
        for (let track of this.mix.tracks){
            sum += track.nodeSpace.compute();
        }
        const l = this.mix.tracks.length
        if (l > 0) sum /= (l);
        this.outputs[0].cache = sum;
    }
    static fromJSON(json: any, mix:Mix): FromTrackNode {
        const node = new FromTrackNode(json.x, json.y, json.id, mix);
        
        return node;
    }
}