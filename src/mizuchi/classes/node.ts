import Mix from "../data/mix";
import OscFunction from "../data/osc_function";
import Track from "../data/track";
import Input, { InputSignal } from "./Input";
import Note from "./note";
import Output, { OutputSignal } from "./Output";

export default abstract class Node{
    x:number;
    y:number;
    inputs: Input[]=[];
    output: Output|null = null;
    window: number|null = null;
    constructor(x:number, y:number){
        this.x = x;
        this.y = y;
    }
    abstract get():any
}

export class OutputNode extends Node {
    constructor(x:number, y:number){
        super(x, y);
        this.inputs = [new InputSignal(this)];
    }
    get():number{
        return this.inputs[0].get();
    }
}

export class NoteInput extends Node {
    constructor(x:number, y:number, public track:Track, public mix:Mix, public osc:OscFunction){
        super(x, y);
        this.output = new OutputSignal(this);
    }
    get():number{
        const SPS = this.mix.sampleRate/this.mix.bpm*120/8;
        const founded:Note[] = this.findNote(this.mix.playback/SPS);
        if (founded.length == 0) return 0;
        let sum:number = 0;
        for (let note of founded){
            const t = this.mix.sampleRate/note.getFrequency();
            sum += this.osc.getSample((this.mix.playback-note.start*SPS)%t/t);
        }
        return sum/founded.length;
    }
    private findNote(rel_time:number):Note[]{
        const notes:Note[] = [];
        for (let score of this.track.scores){
            if (score.absolute_start <= rel_time && rel_time < score.absolute_start + score.duration) {
                rel_time -= score.absolute_start;
                for (let note of score.notes){
                    if (note.start <= rel_time && note.start + note.duration > rel_time){
                        notes.push(note);
                    } else if (note.start > rel_time){
                        return notes;
                    }
                } return notes;
            }
        }
        return notes;
    }
}

export class MixNode extends Node {
    constructor(x:number, y:number){
        super(x, y);
        this.output = new OutputSignal(this);
    }
    get():number{
        let sum = 0;
        for (let input of this.inputs){
            sum += input.get();
        }
        return sum/this.inputs.length;
    }
}