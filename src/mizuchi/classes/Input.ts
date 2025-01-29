import Connector from "./connectors";
import IdComponent from "./id_component";
import Node from "./node";

export default abstract class Input extends IdComponent {
    parent: Node;
    connected: Connector|null = null;
    constructor(parent:Node, public name:string) {
        super(0,"i",parent);
        this.parent = parent;
    }
    abstract get():any
}

export class InputSignal extends Input{
    connected: Connector|null = null;
    constructor(parent:Node, name:string) {
        super(parent, name);
    }
    get():number{
        if (this.connected == null) return 0;
        return this.connected.get();
    }
}
