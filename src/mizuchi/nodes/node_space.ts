import Connector from "../classes/connectors";
import { IdArray } from "../classes/id_component";
import Input from "../classes/Input";
import Output from "../classes/Output";
import Mix from "../data/mix";
import Track from "../data/track";
import View from "../drawers/view";
import Node from "./node";
import OutputNode from "./output_node";

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
        // nodeSpace.window = json.window;
        // nodeSpace.outputNode = OutputNode.fromJSON(json.outputNode, nodeSpace);
        // for (let node of json.NODES.data) {
        //     nodeSpace.add(Node.fromJSON(node, nodeSpace, mix));
        mix = mix// } 
        // // nodeSpace.nodes = IdArray.fromJSON(nodes, nodeSpace.nodes.increment);
        // const connectors = [];
        // for (let connector of json.connectors.data) {
        //     connectors.push(Connector.fromJSON(connector, nodeSpace));
        // }
        // nodeSpace.connectors = IdArray.fromJSON(connectors, nodeSpace.connectors.increment);
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
        // console.log(this.outputNode.get());
        // console.log(this.outputNode.inputs[0].connected?.input?.parent, this.outputNode.inputs[0].connected?.input?.parent.get());
        // (this.outputNode.inputs[0].connected?.input?.parent.get() === 0) ? console.log('ok', this.outputNode.inputs[0].connected?.input?.parent) : console.log('not ok', this.outputNode.inputs[0].connected?.input?.parent);
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
    move(objects:Node[], offset:number[], d:boolean){
        for (let object of objects) {
            if (d) {
                object.translate(offset[0], offset[1]);
            } else {
                object.translate(-offset[0], -offset[1]);
            }
        }
    }
    delete(object:any, place:number){
        if (object instanceof Node) {
            this.nodes.splice(place, 1);
        } else if (object instanceof Connector) {
            this.connectors.splice(place, 1);
        }
    }
    connectNodes(node1:Node, node2:Node, index1:number){
        if (node1.output && node2.inputs.length){
            const input = node1.output
            const output = node2.inputs[index1]
            const con = new Connector(this.connectors.getNewId(), this, input, output);
            this.connectors.push(con);
            input.connected = [con];
            output.connected = con;
        }
    }
}