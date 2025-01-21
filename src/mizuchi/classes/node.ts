import Mapping from "../data/mapping_function";
import Mix from "../data/mix";
import Track from "../data/track";
import Input, { InputSignal } from "./Input";
import Note from "./note";
import Output, { OutputSignal } from "./Output";
import IdComponent, { IdArray } from "./id_component";

export default abstract class Node extends IdComponent {
    x:number;
    y:number;
    inputs: Input[] = [];
    output: Output;
    window: number[] = [];
    constructor(id:number, x:number, y:number, inputs_count:number, parent:any){
        super(id, "e");
        this.parent = parent;
        this.x = x;
        this.y = y;
        this.output = new OutputSignal(this);
        for (let i = 0; i < inputs_count; i++){
            this.inputs.push(new InputSignal(this));
        }
    }
    abstract get():any
    setInput(index:number, out:Output){
        this.inputs[index].connected = out;
    }
    toJSON() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            inputs: this.inputs,
            output: this.output,
            window: this.window,
            type: this.constructor.name
        };
    }
    // clone(){
    //     const clone = new (this.constructor as any)(this.id, this.x, this.y, this.inputs.length, this.parent);
    //     for (let i = 0; i < this.inputs.length; i++){
    //         if (this.inputs[i].connected) clone.setInput(i, this.inputs[i].connected.output);
    //     }
    //     return clone;
    // }
}

export class NodeSpace extends Node {
    outputNode:OutputNode = new OutputNode(0,0,0,this);
    nodes:IdArray<Node> = new IdArray<Node>();
    constructor(x:number, y:number, id:number, parent:any, inputs_count:number=0){
        super(id, x, y, inputs_count, parent);
    }
    get():number{
        return this.outputNode.get();
    }
    add(node:Node){
        this.nodes.push(node);
    }
    clone(){
        const clone = new NodeSpace(this.x, this.y, this.id, this.parent, this.inputs.length);
        // for (let node of this.nodes){
            // clone.add(node.clone());
        // }
        return clone;
    }
}

class OutputNode extends Node {
    constructor(x:number, y:number, id:number, parent:any){
        super(id, x, y, 1, parent);
    }
    get():number{
        return this.inputs[0].get();
    }
}

export class NoteInput extends Node {
    mix:Mix;
    osc:Mapping;
    constructor(x:number, y:number, public parent:Track, mix:Mix, osc:Mapping, id:number){
        super(x, y, 0, id, parent);
        this.mix = mix;
        this.osc = osc;
    }
    get():number{
        const SPS = this.mix.sampleRate/this.mix.bpm*120/8;
        const founded:Note[] = this.findNote(this.mix.playback/SPS);
        if (founded.length == 0) return 0;
        let sum:number = 0;
        for (let note of founded){
            const t = this.mix.sampleRate/note.getFrequency();
            sum += this.osc.getSample((this.mix.playback-note.start*SPS) % t / t);
        }
        return sum/founded.length;
    }
    private findNote(rel_time:number):Note[] {
        for (let score of this.parent.scores) {  
            if (score.absolute_start <= rel_time && rel_time < score.absolute_start + score.duration) {
                rel_time -= score.absolute_start;
                return score.getNotesAt(rel_time); 
            }
        }      
        return [];
    }
    toJSON() {
        return {
            ...super.toJSON(),
            osc: this.osc
        };
    }
}

export class SumNode extends Node {
    constructor(x:number, y:number, id:number, parent:any){
        super(x, y, 0, id, parent);
    }
    get():number{
        let sum = 0;
        for (let input of this.inputs){
            sum += input.get();
        }
        return sum/this.inputs.length;
    }
    addInput(connected:Output){
        if (connected instanceof OutputSignal){
            const input = new InputSignal(this);
            input.connected = connected;
            this.inputs.push(input);
        }
    }
}

export class MixNode extends Node {
    dryWet:number = 0.5;
    constructor(x:number, y:number, id:number, parent:any){
        super(x, y, 2, id, parent);
    }
    get(){
        return this.inputs[0].get()*this.dryWet + this.inputs[1].get()*(1-this.dryWet);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            dryWet: this.dryWet
        };
    }
}

export class DelayNode extends Node {
    windowLenght = 44100;
    constructor(x:number, y:number, id:number, parent:any){
        super(x, y, 1, id, parent);
        this.window.fill(0, 0, this.windowLenght)
    }
    get(){
        this.window.push(this.inputs[0].get());
        return this.window.shift();
    }
    toJSON() {
        return {
            ...super.toJSON(),
            windowLenght: this.windowLenght
        };
    }
}