import IdComponent from "./id_component";
import Node from "./node";
import Output, { OutputSignal } from "./Output";

export default abstract class Input extends IdComponent {
    parent: Node;
    connected: Output|null = null;
    constructor(parent: Node) {
        super(0,"i");
        this.parent = parent;
    }
    toJSON():any{
        return {
            connected: this.connected?.getFullId()
        }
    }
    abstract get():any
}

export class InputSignal extends Input{
    connected: OutputSignal|null = null;
    constructor(parent: Node) {
        super(parent);
    }
    get():number{
        if (this.connected == null) return 0;
        return this.connected.get();
    }
}
