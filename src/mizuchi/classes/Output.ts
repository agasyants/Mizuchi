import Node from "./node";
import Connector from "./connectors";
import IdComponent from "./id_component";

export default abstract class Output extends IdComponent {
    connected: Connector|null = null;
    constructor(parent:Node, public name:string) {
        super(0,"o", parent);
    }
    abstract get():any
}

export class OutputSignal extends Output{
    connected: Connector|null = null;
    constructor(parent:Node, name:string) {
        super(parent, name);
    }
    get():number{
        return this.parent.get();
    }
}