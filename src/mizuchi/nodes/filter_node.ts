import { InputSignal } from "../classes/Input";
import { OutputSignal } from "../classes/Output";
import { mix } from "../data/mix";
import View from "../drawers/view";
import Node from "./node";
import ControlController from "./node_components/control_controller";
import ListComponent from "./node_components/enum";

type FilterType = 'LP' | 'HP' | 'BP';
const FILTER_TYPES: FilterType[] = ['LP', 'HP', 'BP'];

export default class FilterNode extends Node {
    cutoff:    ControlController;
    resonance: ControlController;
    typeList:  ListComponent;

    // Biquad IIR state
    private x1 = 0; private x2 = 0;
    private y1 = 0; private y2 = 0;

    constructor(x: number, y: number, id: number) {
        super(id, x, y, 210, 110, "Filter");
        this.inputs  = [new InputSignal("in", 0, 0, 0, this)];
        this.outputs = [new OutputSignal("out", 0, 0, this)];

        this.cutoff    = new ControlController(this, 0.28, 0.52, 22);
        this.resonance = new ControlController(this, 0.72, 0.52, 22);
        this.cutoff.dry    = 0.5;
        this.resonance.dry = 0.1;
        this.typeList = new ListComponent(this, 0.5, 0.82, 60, 20, FILTER_TYPES, 0);

        this.components = [this.cutoff, this.resonance, this.typeList];
    }

    render(view: View) { this._render(view); }

    findByFullID(fullID: string) {
        if (fullID.length == 0) return this;
        return null;
    }

    compute() {
        const xn = this.inputs[0].get();
        const fs = mix.sampleRate;

        // cutoff knob 0-1 → 20 Hz – 20 kHz (exponential)
        const fc = 20 * Math.pow(1000, this.cutoff.dry);
        // resonance knob 0-1 → Q 0.1–10
        const Q  = 0.1 + this.resonance.dry * 9.9;

        const ω0   = 2 * Math.PI * Math.min(fc, fs * 0.499) / fs;
        const cosW = Math.cos(ω0);
        const sinW = Math.sin(ω0);
        const α    = sinW / (2 * Q);

        let b0: number, b1: number, b2: number;
        const a0 = 1 + α;
        const a1 = -2 * cosW;
        const a2 = 1 - α;

        const type = FILTER_TYPES[this.typeList.pos];
        if (type === 'LP') {
            b0 = (1 - cosW) / 2; b1 = 1 - cosW;      b2 = (1 - cosW) / 2;
        } else if (type === 'HP') {
            b0 = (1 + cosW) / 2; b1 = -(1 + cosW);   b2 = (1 + cosW) / 2;
        } else {
            b0 = α;              b1 = 0;               b2 = -α;
        }

        const yn = (b0 * xn + b1 * this.x1 + b2 * this.x2 - a1 * this.y1 - a2 * this.y2) / a0;

        this.x2 = this.x1; this.x1 = xn;
        this.y2 = this.y1; this.y1 = isFinite(yn) ? yn : 0;

        this.outputs[0].cache = this.y1;
    }

    returnJSON() {
        return {
            ...super.returnJSON(),
            cutoff:     this.cutoff.dry,
            resonance:  this.resonance.dry,
            filterType: this.typeList.pos,
        };
    }

    static fromJSON(json: any): FilterNode {
        const node = new FilterNode(json.x, json.y, json.id);
        if (json.cutoff     !== undefined) node.cutoff.dry    = json.cutoff;
        if (json.resonance  !== undefined) node.resonance.dry = json.resonance;
        if (json.filterType !== undefined) node.typeList.pos  = json.filterType;
        return node;
    }
}
