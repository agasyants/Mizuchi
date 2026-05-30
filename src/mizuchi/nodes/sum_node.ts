import { InputSignal } from "../classes/Input";
import { OutputSignal } from "../classes/Output";
import View from "../drawers/view";
import Node from "./node";

export default class SumNode extends Node {
    constructor(x: number, y: number, id: number) {
        super(id, x, y, 100, 80, "Sum");
        this.inputs = [
            new InputSignal("A", 0, 0, 0, this),
            new InputSignal("B", 1, 0, 0, this),
        ];
        this.outputs = [new OutputSignal("out", 0, 0, this)];
    }

    render(view: View) { this._render(view); }

    findByFullID(fullID: string) {
        if (fullID.length == 0) return this;
        return null;
    }

    compute() {
        this.outputs[0].cache = this.inputs[0].get() + this.inputs[1].get();
    }

    returnJSON() { return { ...super.returnJSON() }; }

    static fromJSON(json: any): SumNode {
        return new SumNode(json.x, json.y, json.id);
    }
}
