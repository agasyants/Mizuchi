import Node from "./node";
import Output, { OutputSignal } from "./Output";

export default abstract class Input {
    parent: Node;
    connected: Output|null = null;
    constructor(parent: Node) {
        this.parent = parent;
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
