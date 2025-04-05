import Mapping from "../data/mapping_function";
import Mix from "../data/mix";
import Track from "../data/track";
import Input, { InputSignal } from "./Input";
import Note from "./note";
import Output, { OutputSignal } from "./Output";
import IdComponent, { IdArray } from "./id_component";
import Connector from "./connectors";
import View from "../drawers/view";

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
        this.height = height;
        this.width = width;
        this.name = name;
        if (hasOut) this.output = new OutputSignal(this, 'out', x+width, y-height/2);
        for (let i = 0; i < input_names.length; i++){
            this.inputs.push(new InputSignal(this, input_names[i], i, x, y-height*(i+1)/(input_names.length+1)));
        }
    }
    abstract get():any
    abstract render(view:View):void
    _render(view:View){
        view.drawFrame(this.x, this.y, this.width, this.height, 2, 'white', 'black');
        for (let i = 0; i < this.inputs.length; i++){
            view.drawPin(this.inputs[i].x, this.inputs[i].y, 4, 1, 'black', 'white');
        }
        if (this.output) view.drawPin(this.output.x, this.output.y, 4, 1, 'black', 'white');
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
    static fromJSON(json:any, parent:any, mix:Mix): Node {
        switch (json.type) {
            case 'NodeSpace': return NodeSpace.fromJSON(json, parent, mix);
            case 'OutputNode': return OutputNode.fromJSON(json, parent);
            case 'NoteInput': return NoteInput.fromJSON(json, mix);
            case 'FromTrackNode': return FromTrackNode.fromJSON(json, mix);
            case 'MixNode': return MixNode.fromJSON(json);
            case 'DelayNode': return DelayNode.fromJSON(json);
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
    constructor(x:number, y:number, id:number, parent:Mix|Track|NodeSpace, public input_names:string[]=[]){
        super(id, x, y, 100, 100, input_names, 'Space', parent);
    }
    render(view:View){
        console.log(view);
        // const x = view.calcX(this.x);
        // const y = view.calcY(this.y);
        // const w = view.calcDim(this.width);
        // const h = view.calcDim(this.height);
        // ctx.fillStyle = 'white';
        // console.log(x + width/2, y + height/2, w, h);
        // ctx.fillRect(x, -y/2, w, h);
        // ctx.fillStyle = 'grey';
        // ctx.fillRect(x+5, -y/2+5, w-10, h-10);
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
        for (let node of json.NODES.data) {
            nodeSpace.add(Node.fromJSON(node, nodeSpace, mix));
        } 
        // nodeSpace.nodes = IdArray.fromJSON(nodes, nodeSpace.nodes.increment);
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
        for (const input of this.outputNode.inputs) {
            if (input.getFullId() === fullId) {
                return input;
            }
        }
        return null;
    }
    get():number{
        return this.outputNode.get();
    }
    add(node:Node){
        node.parent = this;
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
    constructor(x:number, y:number, id:number, parent:NodeSpace){
        super(id, x, y, 100, 50, ['in'], 'Output', parent);
    }
    render(view:View){
        // console.log(view);
        this._render(view);
        // const x = view.calcX(this.x);
        // const y = view.calcY(this.y);
        // const w = view.calcDim(this.width);
        // const h = view.calcDim(this.height);
        // ctx.fillStyle = 'white';
        // ctx.fillRect(x, -y/2, w, h);
        // ctx.fillStyle = 'blue';
        // ctx.fillRect(x+5, -y/2+5, w-10, h-10);
        // ctx.fillStyle = 'white';
        // ctx.font = String(30*view.scale)+'px Arial';
        // ctx.scale(1, -1);
        // ctx.fillText(this.name, x+w/16,y+height/2-h/4);
        // ctx.scale(1, -1);
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
    track:Track|null = null;
    constructor(x:number, y:number, mix:Mix, osc:Mapping, id:number){
        super(id, x, y, 100, 150, [], 'Note Input', parent);
        this.mix = mix;
        this.osc = osc;
    }
    render(view:View){
        this._render(view);
    }
    findByFullID(fullID:string) {
        if (fullID.length==0) return this;
        return null;
    }
    get():number {
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
        if (this.track == null) return [];
        for (let score of this.track.scores) {  
            if (score.absolute_start <= rel_time && rel_time < score.absolute_start + score.duration) {
                rel_time -= score.absolute_start;
                return score.getNotesAt(rel_time); 
            }
        }
        return [];
    } 
    returnJSON() {
        if (this.track == null) return super.returnJSON();
        return {
            ...super.returnJSON(),
            osc: this.osc,
            track: this.track.getFullId()
        }; 
    }
    static fromJSON(json:any, mix:Mix): NoteInput {
        const node = new NoteInput(json.x, json.y, mix, json.osc, json.id);
        mix.setAsideFullID(json.track, node.track)
        node.window = json.window;
        return node;
    }
}

export class FromTrackNode extends Node {
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
        return sum/this.inputs.length;
    }
    static fromJSON(json: any, mix:Mix): FromTrackNode {
        const node = new FromTrackNode(json.x, json.y, json.id, mix);
        node.window = json.window;
        return node;
    }
}

export class MixNode extends Node {
    dryWet:number = 0.5;
    constructor(x:number, y:number, id:number){
        super(id, x, y, 100, 80, ['track1','track2'], 'MixNode');
    }
    render(view:View){
        this._render(view);
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
    static fromJSON(json: any): MixNode {
        const node = new MixNode(json.x, json.y, json.id);
        node.window = json.window;
        node.dryWet = json.dryWet;
        return node;
    }
}

export class DelayNode extends Node {
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