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
import InputNode from "./input_node";

export default class NodeSpace extends Node {
    outputNode:OutputNode = new OutputNode(0,0,0,this);
    inputNode:InputNode = new InputNode(0,0,1,this)
    nodes:IdArray<Node> = new IdArray<Node>();
    connectors:IdArray<Connector> = new IdArray<Connector>();
    constructor(x:number, y:number, id:number, parent:Mix|Track|NodeSpace, public input_names:string[]=[]){
        super(id, x, y, 100, 100, 'Space', parent);
    }
    render(view:View){
        console.log(view);
    }
    returnJSON() {
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
        nodeSpace.outputNode = OutputNode.fromJSON(json.outputNode, nodeSpace);
        let i = 0
        for (let node of json.NODES.data) {
            nodeSpace.create(NodeSpace.AnyNodefromJSON(node, nodeSpace, mix), i);
            i += 1
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
            for (const output of node.outputs) {
                if (output.getFullId() === fullId) {
                    return output;
                }
            }
        }
        for (const output of this.inputNode.outputs) {
            if (output.getFullId() === fullId) {
                return output;
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
    compute():number{
        return this.outputNode.compute();
    }
    create(obj:Node|Connector, place:number){
        if (obj instanceof Node){
            obj.parent = this;
            this.nodes.splice(place, 0, obj);
        } else if (obj instanceof Connector && obj.input && obj.output) {
            const out_index = obj.output.parent.inputs.indexOf(obj.output);
            const in_index = obj.input.parent.outputs.indexOf(obj.input);
            console.log(obj, out_index, in_index)
            this.connectNodes(obj.input.parent, obj.output.parent, in_index, out_index, place);
        }
        console.log(this.nodes)
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
    }
    delete(object:any, place:number){
        if (object instanceof Node) {
            this.nodes.splice(place, 1);
        } else if (object instanceof Connector) {
            if (object.input) {
                object.input.connected.splice(object.input.connected.indexOf(object), 1)
            }
            if (object.output) object.output.connected = null;
            
            this.connectors.splice(place, 1);
        }
    }
    connectNodes(node1:Node, node2:Node, input_index:number, output_index:number, con_i:number){
        if (node1.outputs.length && node2.inputs.length){
            const input = node1.outputs[input_index]
            const output = node2.inputs[output_index]
            const con = new Connector(this.connectors.getNewId(), this, input, output);
            this.connectors.splice(con_i, 0, con);
            input.connected.push(con);
            output.connected = con;
        }
    }
}