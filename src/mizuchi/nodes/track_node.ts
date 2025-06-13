import Mix from "../data/mix";
import View from "../drawers/view";
import Node from "./node";

export default class FromTrackNode extends Node {
    constructor(x:number, y:number, id:number, public mix:Mix){
        super(id, x, y, 90, 160, [], 'FromTrackNode');
    }
    render(view:View){
        // console.log(view);
        this._render(view);
    }
    findByFullID(fullID:string) {
        if (fullID.length==0) return this;
        return null;
    }
    get():number{
        let sum = 0;
        for (let track of this.mix.tracks){
            sum += track.nodeSpace.get();
        }
        if (this.inputs.length>0) sum /= this.inputs.length;
        // console.log('FromTrackNode')
        return sum;
    }
    static fromJSON(json: any, mix:Mix): FromTrackNode {
        const node = new FromTrackNode(json.x, json.y, json.id, mix);
        node.window = json.window;
        return node;
    }
}