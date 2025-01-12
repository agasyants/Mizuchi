import Node from "./node";
import Input, { InputSignal } from "./Input";
import IdComponent from "./id_component";

export default abstract class Output extends IdComponent {
    connected: Input|null = null;
    constructor(parent: Node) {
        super(0,"o");
        this.parent = parent;
    }
    toJSON():any{
        return {
            connected: this.connected?.getFullId()
        }
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