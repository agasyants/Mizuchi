import Node from "./node";
import Input, { InputSignal } from "./Input";

export default abstract class Output {
    parent: Node;
    connected: Input|null = null;
    constructor(parent: Node) {
        this.parent = parent;
    }
    abstract get():any
}

export class OutputSignal extends Output{
    connected: InputSignal|null = null;
    constructor(parent: Node) {
        super(parent);
    }
    get():number{
        return this.parent.get();
    }
}