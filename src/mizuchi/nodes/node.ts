import IdComponent from "../classes/id_component";
import Input, { InputSignal } from "../classes/Input";
import Output, { OutputSignal } from "../classes/Output";
// import Mix from "../data/mix";
import View from "../drawers/view";
// import DelayNode from "./delay_node";
// import MixNode from "./mix_node";
// import NodeSpace from "./node_space";
// import NoteInput from "./note_input_node";
// import OutputNode from "./output_node";
// import FromTrackNode from "./track_node";


export default abstract class Node extends IdComponent {
    x:number;
    y:number;
    width:number;
    height:number;
    name:string;
    inputs: Input[] = [];
    output: Output|null = null;
    window: number[] = [];
    static getSeparator(){
        return 'e';
    }
    constructor(id:number, x:number, y:number, width:number, height:number, input_names:string[], name:string, parent:any|null=null, hasOut:boolean=true){
        super(id, Node.getSeparator(), parent);
        this.x = x;
        this.y = y;
        console.log(x,y);
        
        this.height = height;
        this.width = width;
        this.name = name;
        if (hasOut) this.output = new OutputSignal(this, 'out', x+width, y-height/2);
        for (let i = 0; i < input_names.length; i++){
            this.inputs.push(new InputSignal(this, input_names[i], i, x, y-height*(i+1)/(input_names.length+1)));
        }
    }
    moveTo(x:number, y:number){
        this.x = x;
        this.y = y;
        for (let i = 0; i < this.inputs.length; i++){
            this.inputs[i].x = x;
            this.inputs[i].y = y-this.height*(i+1)/(this.inputs.length+1);
        }
        if (this.output) {
            this.output.x = x + this.width;
            this.output.y = y - this.height/2;
        }
    }
    abstract get():any
    abstract render(view:View):void
    _render(view:View){
        const color = view.getColor(this);
        if (color === view.color.selected){
            const of = view.selected.offset;
            view.drawFrame(this.x-of.start, this.y-of.pitch, this.width, this.height, 2, color, view.color.back);
        } else {
            view.drawFrame(this.x, this.y, this.width, this.height, 2, color, view.color.back);
        }
        for (let i = 0; i < this.inputs.length; i++){
            this.inputs[i].render(view)
        } 
        if (this.output) this.output.render(view);
        view.drawText(this.x, this.y, this.width, this.height, this.name, color)
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
                a.curve.move(point, [x,y], false)
            }
        }
        if (this.output) {
            this.output.x += x;
            this.output.y += y;
            const a = this.output.connected;
            if (a) {
                const point = a.curve.basics[0];
                a.curve.move(point, [x,y], false)
            }
        };
    }
    returnJSON() {
        return {
            type: this.constructor.name,
            id: this.id,
            x: this.x,
            y: this.y,
            name: this.name,
            window: this.window,
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
        if (this.output && this.output.hitScan(x, y, r)) {
            return this.output;
        }
        if (x < this.x || x > this.x+this.width || y > this.y || y < this.y-this.height) {
            return null;
        } else {
            return this;
        }
    }
}