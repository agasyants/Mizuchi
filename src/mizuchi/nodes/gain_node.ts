import { InputSignal } from "../classes/Input";
import { OutputSignal } from "../classes/Output";
import View from "../drawers/view";
import Node from "./node";
import ControlController from "./node_components/control_controller";

export default class GainNode extends Node {
    gain: ControlController;

    constructor(x: number, y: number, id: number) {
        super(id, x, y, 100, 80, "Gain");
        this.inputs  = [new InputSignal("in", 0, 0, 0, this)];
        this.outputs = [new OutputSignal("out", 0, 0, this)];
        this.gain = new ControlController(this, 0.5, 0.55, 22);
        this.gain.dry = 0.5; // maps to 1.0× (range: 0–2×)
        this.components = [this.gain];
    }

    render(view: View) { this._render(view); }

    findByFullID(fullID: string) {
        if (fullID.length == 0) return this;
        return null;
    }

    compute() {
        this.outputs[0].cache = this.inputs[0].get() * this.gain.dry * 2;
    }

    returnJSON() {
        return { ...super.returnJSON(), gain: this.gain.dry };
    }

    static fromJSON(json: any): GainNode {
        const node = new GainNode(json.x, json.y, json.id);
        if (json.gain !== undefined) node.gain.dry = json.gain;
        return node;
    }
}
