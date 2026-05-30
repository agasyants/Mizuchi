import { InputMultiFloat } from "../classes/Input";
import { OutputSignal } from "../classes/Output";
import { mix } from "../data/mix";
import View from "../drawers/view";
import Node from "../nodes/node";
import ListComponent from "./node_components/enum";

type Waveform = 'SINE' | 'SAW' | 'SQUARE' | 'TRIANGLE';
const WAVEFORMS: Waveform[] = ['SINE', 'SAW', 'SQUARE', 'TRIANGLE'];

function waveformSample(waveform: Waveform, phase: number): number {
    switch (waveform) {
        case 'SINE':     return Math.sin(2 * Math.PI * phase);
        case 'SAW':      return 2 * phase - 1;
        case 'SQUARE':   return phase < 0.5 ? 1 : -1;
        case 'TRIANGLE': return 1 - 4 * Math.abs(phase - 0.5);
    }
}

export default class BaseOscNode extends Node {
    waveformList: ListComponent;

    constructor(x: number, y: number, id: number) {
        super(id, x, y, 200, 100, "Oscillator");
        this.inputs = [new InputMultiFloat('freqs', 0, 0, 0, this)];
        this.outputs = [new OutputSignal("signal", 0, 0, this)];
        this.waveformList = new ListComponent(this, 0.5, 0.65, 100, 22, WAVEFORMS, 0);
        this.components = [this.waveformList];
    }

    render(view: View) { this._render(view); }

    findByFullID(fullID: string) {
        if (fullID.length == 0) return this;
        return null;
    }

    compute() {
        const freqs: number[] = this.inputs[0].get();
        if (freqs.length == 0) { this.outputs[0].cache = 0; return; }

        const waveform = WAVEFORMS[this.waveformList.pos];
        let sum = 0;
        for (const freq of freqs) {
            const period = mix.sampleRate / freq;
            const phase = (mix.playback % period) / period;
            sum += waveformSample(waveform, phase);
        }
        this.outputs[0].cache = sum / freqs.length;
    }

    returnJSON() {
        return { ...super.returnJSON(), waveform: this.waveformList.pos };
    }

    static fromJSON(json: any): BaseOscNode {
        const node = new BaseOscNode(json.x, json.y, json.id);
        if (json.waveform !== undefined) node.waveformList.pos = json.waveform;
        return node;
    }
}
