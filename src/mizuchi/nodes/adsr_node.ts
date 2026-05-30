import { OutputSignal } from "../classes/Output";
import { mix } from "../data/mix";
import Track from "../data/track";
import View from "../drawers/view";
import Node from "./node";
import ControlController from "./node_components/control_controller";

export default class ADSRNode extends Node {
    attack:  ControlController;
    decay:   ControlController;
    sustain: ControlController;
    release: ControlController;
    track: Track | null = null;

    constructor(x: number, y: number, id: number) {
        super(id, x, y, 240, 100, "ADSR");
        this.inputs  = [];
        this.outputs = [new OutputSignal("env", 0, 0, this)];

        this.attack  = new ControlController(this, 0.15, 0.55, 22);
        this.decay   = new ControlController(this, 0.38, 0.55, 22);
        this.sustain = new ControlController(this, 0.62, 0.55, 22);
        this.release = new ControlController(this, 0.85, 0.55, 22);

        this.attack.dry  = 0.1;
        this.decay.dry   = 0.2;
        this.sustain.dry = 0.7;
        this.release.dry = 0.15;

        this.components = [this.attack, this.decay, this.sustain, this.release];
    }

    render(view: View) { this._render(view); }

    findByFullID(fullID: string) {
        if (fullID.length == 0) return this;
        return null;
    }

    setTrack(track: Track) { this.track = track; }

    compute() {
        if (this.track == null) { this.outputs[0].cache = 0; return; }

        const SPS = mix.sampleRate / mix.bpm * 120 / 8;
        const now = mix.playback;

        // Knob 0-1 → seconds: A/D 0-2s, S 0-1 level, R 0-4s
        const A = this.attack.dry  * 2 * mix.sampleRate;
        const D = this.decay.dry   * 2 * mix.sampleRate;
        const S = this.sustain.dry;
        const R = this.release.dry * 4 * mix.sampleRate;

        const rBeats   = R / SPS;
        const relTime  = now / SPS;
        let   maxEnv   = 0;

        for (const score of this.track.scores) {
            if (score.absolute_start > relTime + rBeats) continue;
            if (score.absolute_start + score.duration + rBeats < relTime) continue;

            for (const note of score.notes) {
                const noteOnSample  = (score.absolute_start + note.start) * SPS;
                const noteOffSample = noteOnSample + note.duration * SPS;
                const timeSinceOn   = now - noteOnSample;
                const timeSinceOff  = now - noteOffSample;

                if (timeSinceOn < 0 || timeSinceOff > R) continue;

                let env: number;
                if (timeSinceOff >= 0) {
                    env = R > 0 ? S * (1 - timeSinceOff / R) : 0;
                } else if (A > 0 && timeSinceOn < A) {
                    env = timeSinceOn / A;
                } else if (D > 0 && timeSinceOn < A + D) {
                    env = 1 - (1 - S) * (timeSinceOn - A) / D;
                } else {
                    env = S;
                }

                if (env > maxEnv) maxEnv = env;
            }
        }

        this.outputs[0].cache = maxEnv;
    }

    returnJSON() {
        return {
            ...super.returnJSON(),
            attack:  this.attack.dry,
            decay:   this.decay.dry,
            sustain: this.sustain.dry,
            release: this.release.dry,
            track:   this.track?.getFullId() ?? null,
        };
    }

    static fromJSON(json: any): ADSRNode {
        const node = new ADSRNode(json.x, json.y, json.id);
        if (json.attack  !== undefined) node.attack.dry  = json.attack;
        if (json.decay   !== undefined) node.decay.dry   = json.decay;
        if (json.sustain !== undefined) node.sustain.dry = json.sustain;
        if (json.release !== undefined) node.release.dry = json.release;
        if (json.track) {
            mix.setAsideFullID(json.track, (track) => { node.track = track; });
        }
        return node;
    }
}
