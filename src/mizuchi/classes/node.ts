import Mapping from "../data/mapping_function";
import Mix from "../data/mix";
import Track from "../data/track";
import Input, { InputSignal } from "./Input";
import Note from "./note";
import Output, { OutputSignal } from "./Output";
import IdComponent, { IdArray } from "./id_component";
import Connector from "./connectors";

export default abstract class Node extends IdComponent {
    x:number;
    y:number;
    name:string;
    inputs: Input[] = [];
    output: Output|null = null;
    window: number[] = [];
    static getSeparator(){
        return 'e';
    }
    constructor(id:number, x:number, y:number, input_names:string[], parent:any, name:string, hasOut:boolean=true){
        super(id, Node.getSeparator(), parent);
        this.parent = parent;
        this.x = x;
        this.y = y;
        this.name = name;
        if (hasOut) this.output = new OutputSignal(this,'out');
        for (let i = 0; i < input_names.length; i++){
            this.inputs.push(new InputSignal(this, input_names[i], i));
        }
    }
    abstract get():any
    returnJSON() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            window: this.window,
            type: this.constructor.name
        };
    }
    static fromJSON(json:any, parent:any, mix:Mix): Node {
        switch (json.type) {
            case 'NodeSpace': return NodeSpace.fromJSON(json, parent, mix);
            case 'OutputNode': return OutputNode.fromJSON(json, parent);
            case 'NoteInput': return NoteInput.fromJSON(json, parent, mix);
            case 'FromTrackNode': return FromTrackNode.fromJSON(json, parent);
            case 'MixNode': return MixNode.fromJSON(json, parent);
            case 'DelayNode': return DelayNode.fromJSON(json, parent);
            default: return new OutputNode(0,0,0,parent);
        }
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
    connectors:IdArray<Connector> = new IdArray<Connector>();
    constructor(x:number, y:number, id:number, parent:any, public input_names:string[]=[]){
        super(id, x, y, input_names, parent, 'Space');
    }
    returnJSON() {
        return {
            sep: Node.getSeparator(),
            ...super.returnJSON(),
            outputNode: this.outputNode,
            NODES: this.nodes,
            connectors: this.connectors,
        };
    }
    findByFullID(fullID:string) {
        if (!fullID) return this;
        if (fullID.startsWith(Node.getSeparator())){
            fullID = fullID.slice(Node.getSeparator().length);
            const index = parseInt(fullID, 10)
            return this.nodes[index].findByFullID(fullID.slice(String(index).length));
        }
        return null;
    }
    static fromJSON(json:any, parent:any, mix:Mix): NodeSpace {
        const nodeSpace = new NodeSpace(json.x, json.y, json.id, parent, json.input_names);
        nodeSpace.window = json.window;
        nodeSpace.outputNode = OutputNode.fromJSON(json.outputNode, nodeSpace);
        const nodes = [];
        for (let node of json.NODES.data) {
            nodes.push(Node.fromJSON(node, nodeSpace, mix));
        } 
        nodeSpace.nodes = IdArray.fromJSON(nodes, nodeSpace.nodes.increment);
        const connectors = [];
        for (let connector of json.connectors.data) {
            connectors.push(Connector.fromJSON(connector, nodeSpace));
        }
        nodeSpace.connectors = IdArray.fromJSON(connectors, nodeSpace.connectors.increment);
        return nodeSpace;
    }
    findOutputById(fullId: string): Output|null {
        for (const node of this.nodes) {
            if (node.output && node.output.getFullId() === fullId) {
                return node.output;
            }
        }
        return null;
    }
    findInputById(fullId: string): Input|null {
        for (const node of this.nodes) {
            for (const input of node.inputs) {
                if (input.getFullId() === fullId) {
                    return input;
                }
            }
        }
        return null;
    }
    get():number{
        return this.outputNode.get();
    }
    add(node:Node){
        this.nodes.push(node);
    }
    clone(){
        const clone = new NodeSpace(this.x, this.y, this.id, this.parent, this.input_names);
        // for (let node of this.nodes){
            // clone.add(node.clone());
        // }
        return clone;
    }
    connectNodes(node1:Node, node2:Node, index1:number){
        if (node1.output && node2.inputs.length){
            const input = node1.output
            const output = node2.inputs[index1]
            const con = new Connector(this.connectors.getNewId(), this, input, output);
            this.connectors.push(con);
            input.connected = con;
            output.connected = con;
        }
    }
}

class OutputNode extends Node {
    constructor(x:number, y:number, id:number, parent:any){
        super(id, x, y, ['in'], parent, 'Output', false);
    }
    findByFullID(fullID:string) {
        if (fullID.length==0) return this;
        return null;
    }
    static fromJSON(json: any, parent: any): OutputNode {
        const node = new OutputNode(json.x, json.y, json.id, parent);
        node.window = json.window;
        return node;
    }
    get():number{
        return this.inputs[0].get();
    }
}

export class NoteInput extends Node {
    mix:Mix;
    osc:Mapping;
    constructor(x:number, y:number, public parent:Track, mix:Mix, osc:Mapping, id:number){
        super(id, x, y, [], parent, 'Note Input');
        this.mix = mix;
        this.osc = osc;
    }
    findByFullID(fullID:string) {
        if (fullID.length==0) return this;
        return null;
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
    private findNote(rel_time:number): Note[] {
        for (let score of this.parent.scores) {  
            if (score.absolute_start <= rel_time && rel_time < score.absolute_start + score.duration) {
                rel_time -= score.absolute_start;
                return score.getNotesAt(rel_time); 
            }
        }      
        return [];
    }
    returnJSON() {
        return {
            ...super.returnJSON(),
            osc: this.osc
        };
    }
    static fromJSON(json:any, parent:any, mix:Mix): NoteInput {
        const node = new NoteInput(json.x, json.y, parent, mix, json.osc, json.id);
        node.window = json.window;
        return node;
    }
}

export class FromTrackNode extends Node {
    constructor(x:number, y:number, id:number, parent:any, public tracks:Track[]){
        super(id, x, y, [], parent, 'FromTrackNode');
    }
    findByFullID(fullID:string) {
        if (fullID.length==0) return this;
        return null;
    }
    get():number{
        let sum = 0;
        for (let track of this.tracks){
            sum += track.nodeSpace.get();
        }
        return sum/this.inputs.length;
    }
    static fromJSON(json: any, parent: any): FromTrackNode {
        const node = new FromTrackNode(json.x, json.y, json.id, parent, json.tracks);
        node.window = json.window;
        return node;
    }
}

export class MixNode extends Node {
    dryWet:number = 0.5;
    constructor(x:number, y:number, id:number, parent:any){
        super(id, x, y, ['track1','track2'], parent, 'MixNode');
    }
    findByFullID(fullID:string) {
        if (fullID.length==0) return this;
        return null;
    }
    get(){
        return this.inputs[0].get()*this.dryWet + this.inputs[1].get()*(1-this.dryWet);
    }
    returnJSON() {
        return {
            ...super.returnJSON(),
            dryWet: this.dryWet
        };
    }
    static fromJSON(json: any, parent: any): MixNode {
        const node = new MixNode(json.x, json.y, json.id, parent);
        node.window = json.window;
        node.dryWet = json.dryWet;
        return node;
    }
}

export class DelayNode extends Node {
    windowLenght = 44100;
    constructor(x:number, y:number, id:number, parent:any){
        super(id, x, y, ['input'], parent, 'Delay');
        this.window.fill(0, 0, this.windowLenght)
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
    static fromJSON(json: any, parent: any): DelayNode {
        const node = new DelayNode(json.x, json.y, json.id, parent);
        node.window = json.window;
        node.windowLenght = json.windowLenght;
        return node;
    }
}