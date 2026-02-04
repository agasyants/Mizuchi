import Connector from "../classes/connectors";
import { IdArray } from "../classes/id_component";
import Input from "../classes/Input";
import Output from "../classes/Output";
import Mix from "../data/mix";
import Track from "../data/track";
import View from "../drawers/view";
import Node from "./node";
import OutputNode from "./output_node";
import NoteInput from "./note_input_node"
import FromTrackNode from "./track_node";
import MixNode from "./mix_node";
import DelayNode from "./delay_node";
import DistortionNode from "./distortion_node";

export default class NodeSpace extends Node {
    outputNode:OutputNode = new OutputNode(0,0,0,this);
    nodes:IdArray<Node> = new IdArray<Node>();
    connectors:IdArray<Connector> = new IdArray<Connector>();
    constructor(x:number, y:number, id:number, parent:Mix|Track|NodeSpace, public input_names:string[]=[]){
        super(id, x, y, 100, 100, input_names, 'Space', parent);
    }
    render(view:View){
        console.log(view);
    }
    returnJSON() {
        console.log(this.nodes.increment)
        return {
            sep: Node.getSeparator(),
            ...super.returnJSON(),
            outputNode: this.outputNode,
            NODES: this.nodes,
            connectors: this.connectors.toJSON(),
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
            nodeSpace.create(NodeSpace.AnyNodefromJSON(node, nodeSpace, mix));
        } 
        nodeSpace.nodes = IdArray.fromJSON(nodeSpace.nodes, json.NODES.increment);
        const connectors = [];
        for (let connector of json.connectors.data) {
            connectors.push(Connector.fromJSON(connector, nodeSpace));
        }
        nodeSpace.connectors = IdArray.fromJSON(connectors, json.connectors.increment);
        return nodeSpace;
    }
    static AnyNodefromJSON(json:any, parent:any, mix:Mix): Node {
        switch (json.type) {
            case 'NodeSpace': return NodeSpace.fromJSON(json, parent, mix);
            case 'OutputNode': return OutputNode.fromJSON(json, parent);
            case 'NoteInput': return NoteInput.fromJSON(json, mix);
            case 'FromTrackNode': return FromTrackNode.fromJSON(json, mix);
            case 'MixNode': return MixNode.fromJSON(json);
            case 'DelayNode': return DelayNode.fromJSON(json);
            case 'DistortionNode': return DistortionNode.fromJSON(json);
            default: return new OutputNode(0,0,0,parent);
        }
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
    create(obj:Node|Connector){
        if (obj instanceof Node){
            obj.parent = this;
            this.nodes.push(obj);
        } else if (obj instanceof Connector && obj.input && obj.output) {
            const index = obj.output.parent.inputs.indexOf(obj.output);
            this.connectNodes(obj.input.parent, obj.output.parent, index);
        }
    }
    clone(){
        const clone = new NodeSpace(this.x, this.y, this.id, this.parent, this.input_names);
        // for (let node of this.nodes){
            // clone.add(node.clone());
        // }
        return clone;
    }
    move(object:Node, offset:number[]){
        object.moveTo(offset[0], offset[1]);
        console.warn(object, offset)
    }
    delete(object:any, place:number){
        if (object instanceof Node) {
            this.nodes.splice(place, 1);
            for (let input of object.inputs){
                if (input.connected) {
                    this.delete(input.connected, this.connectors.indexOf(input.connected));
                }
            }
            if (object.output && object.output.connected) {
                for (let output of object.output.connected) {
                    this.delete(output, this.connectors.indexOf(output));
                }
            }
        } else if (object instanceof Connector) {
            if (object.input) {
                object.input.connected.splice(object.input.connected.indexOf(object), 1)
            }
            if (object.output) object.output.connected = null;
            
            this.connectors.splice(place, 1);
        }
    }
    connectNodes(node1:Node, node2:Node, index1:number){
        if (node1.output && node2.inputs.length){
            const input = node1.output
            const output = node2.inputs[index1]
            const con = new Connector(this.connectors.getNewId(), this, input, output);
            this.connectors.push(con);
            input.connected.push(con);
            output.connected = con;
        }
    }
}