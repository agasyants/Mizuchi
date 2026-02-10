import IdComponent from "../classes/id_component";
import Input from "../classes/Input";
import Output from "../classes/Output";
// import Mix from "../data/mix";
import View from "../drawers/view";
import NodeComponent from "./node_components/node_component";


export default abstract class Node extends IdComponent {
    inputs:Input[] = []
    outputs:Output[] = []
    x:number;
    y:number;
    width:number;
    height:number;
    name:string;
    components: NodeComponent[] = []
    static getSeparator(){
        return 'e';
    }
    constructor(id:number, x:number, y:number, width:number, height:number, name:string, parent:any|null=null){
        super(id, Node.getSeparator(), parent);
        this.x = x;
        this.y = y;
        this.height = height;
        this.width = width;
        this.name = name;
    }
    moveTo(x:number, y:number){
        this.x = x;
        this.y = y;
        for (let i = 0; i < this.inputs.length; i++){
            this.inputs[i].x = x;
            this.inputs[i].y = y-this.height*(i+1)/(this.inputs.length+1);
            const a = this.inputs[i].connected;
            if (a) {
                const point = a.curve.basics[a.curve.basics.length-1];
                a.curve.move(point, [this.inputs[i].x, this.inputs[i].y])
            }
        }
        for (let i = 0; i < this.outputs.length; i++){
            this.outputs[i].x = x+this.width;
            this.outputs[i].y = y-this.height*(i+1)/(this.inputs.length+1);
            for (let a of this.outputs[i].connected){
                const point = a.curve.basics[0];
                a.curve.move(point, [this.outputs[i].x, this.outputs[i].y])
            }
        }
    }
    abstract compute():any
    abstract render(view:View):void
    _render(view:View){
        const color = view.getColor(this);
        view.drawFrame(this.x, this.y, this.width, this.height, 1.2, color, view.color.back);
        for (let i = 0; i < this.inputs.length; i++){
            this.inputs[i].render(view)
        } 
        for (let i = 0; i < this.outputs.length; i++){
            this.outputs[i].render(view)
        }
        view.drawText(this.x, this.y-this.height/3, this.width, this.height, this.name, color)
        
        for (let com of this.components) {
            com.render(view)
        }
    }
    correctPos(x:number, y:number){
        let rx = this.x + x*this.width
        let ry = this.y + y*this.height
        return [rx, ry]
    }
    correctSize(x:number, y:number){
        let rx = x*this.width
        let ry = y*this.height
        return [rx, ry]
    }
    translate(x:number, y:number){
        this.x += x;
        this.y += y;
        for (let i of this.inputs){
            i.x += x;
            i.y += y;
            const a = i.connected;
            if (a) {
                const point = a.curve.basics[a.curve.basics.length-1];
                a.curve.move(point, [x+point.x, y+point.y])
            }
        }
        for (let o of this.outputs){
            o.x += x;
            o.y += y;
            for (let a of o.connected){
                const point = a.curve.basics[0];
                a.curve.move(point, [x+point.x, y+point.y])
            }
        };
    }
    returnJSON() {
        return {
            type: this.constructor.name,
            id: this.id,
            x: this.x,
            y: this.y,
            name: this.name
        };
    }
    // static fromJSON(json:any, parent:any, mix:Mix): Node {
    //     switch (json.type) {
    //         case 'NodeSpace': return NodeSpace.fromJSON(json, parent, mix);
    //         case 'OutputNode': return OutputNode.fromJSON(json, parent);
    //         case 'NoteInput': return NoteInput.fromJSON(json, mix);
    //         case 'FromTrackNode': return FromTrackNode.fromJSON(json, mix);
    //         case 'MixNode': return MixNode.fromJSON(json);
    //         case 'DelayNode': return DelayNode.fromJSON(json);
    //         default: return new OutputNode(0,0,0,parent);
    //     }
    // }
    // clone(){
    //     const clone = new (this.constructor as any)(this.id, this.x, this.y, this.inputs.length, this.parent);
    //     for (let i = 0; i < this.inputs.length; i++){
    //         if (this.inputs[i].connected) clone.setInput(i, this.inputs[i].connected.output);
    //     }
    //     return clone;
    // }
    hitScan(x:number, y:number, r:number){
        if (x+r < this.x || x-r > this.x+this.width || y-r > this.y || y+r < this.y-this.height) {
            return null;
        }
        for (let i = 0; i < this.inputs.length; i++){
            if (this.inputs[i].hitScan(x, y, r)) {
                return this.inputs[i];
            }
        }
        for (let i = 0; i < this.outputs.length; i++){
            if (this.outputs[i].hitScan(x, y, r)) {
                return this.outputs[i];
            }
        }
        if (x < this.x || x > this.x+this.width || y > this.y || y < this.y-this.height) {
            return null;
        } else {
            let xn = (x - this.x) / this.width
            let yn = (y - this.y) / this.height
            for (let comp of this.components) {
                if (comp.hitScan(xn, -yn, r)) {
                    return comp
                }
            }
            return this;
        }
    }
}