import { OutputSignal } from "../classes/Output";
import { mix } from "../data/mix";
import View from "../drawers/view";
import Node from "./node";
import ControlController from "./node_components/control_controller";
import ListComponent from "./node_components/enum";

type LFOWave = 'SINE' | 'SAW' | 'SQUARE' | 'TRIANGLE';
const LFO_WAVES: LFOWave[] = ['SINE', 'SAW', 'SQUARE', 'TRIANGLE'];

function lfoSample(wave: LFOWave, phase: number): number {
    switch (wave) {
        case 'SINE':     return Math.sin(2 * Math.PI * phase);
        case 'SAW':      return 2 * phase - 1;
        case 'SQUARE':   return phase < 0.5 ? 1 : -1;
        case 'TRIANGLE': return 1 - 4 * Math.abs(phase - 0.5);
    }
}

export default class LFONode extends Node {
    rate:         ControlController;
    waveformList: ListComponent;

    constructor(x: number, y: number, id: number) {
        super(id, x, y, 210, 100, "LFO");
        this.inputs  = [];
        this.outputs = [new OutputSignal("out", 0, 0, this)];

        this.rate = new ControlController(this, 0.25, 0.55, 22);
        this.rate.dry = 0.15; // default ~0.3 Hz
        this.waveformList = new ListComponent(this, 0.65, 0.65, 100, 22, LFO_WAVES, 0);

        this.components = [this.rate, this.waveformList];
    }

    render(view: View) { this._render(view); }

    findByFullID(fullID: string) {
        if (fullID.length == 0) return this;
        return null;
    }

    compute() {
        // rate knob 0-1 → 0.05 Hz – 20 Hz (exponential)
        const freq   = 0.05 * Math.pow(400, this.rate.dry);
        const period = mix.sampleRate / freq;
        const phase  = (mix.playback % period) / period;
        this.outputs[0].cache = lfoSample(LFO_WAVES[this.waveformList.pos], phase);
    }

    returnJSON() {
        return {
            ...super.returnJSON(),
            rate:     this.rate.dry,
            waveform: this.waveformList.pos,
        };
    }

    static fromJSON(json: any): LFONode {
        const node = new LFONode(json.x, json.y, json.id);
        if (json.rate     !== undefined) node.rate.dry         = json.rate;
        if (json.waveform !== undefined) node.waveformList.pos = json.waveform;
        return node;
    }
}
