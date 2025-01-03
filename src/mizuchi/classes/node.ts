import Mapping from "../data/mapping_function";
import Mix from "../data/mix";
import Track from "../data/track";
import Input, { InputSignal } from "./Input";
import Note from "./note";
import Output, { OutputSignal } from "./Output";

export default abstract class Node{
    x:number;
    y:number;
    inputs: Input[] = [];
    output: Output;
    window: number[] = [];
    constructor(x:number, y:number, inputs_count:number){
        this.x = x;
        this.y = y;
        this.output = new OutputSignal(this);
        for (let i = 0; i < inputs_count; i++){
            this.inputs.push(new InputSignal(this));
        }
    }
    abstract get():any
    setInput(index:number, out:Output){
        this.inputs[index].connected = out;
    }
}

export class OutputNode extends Node {
    constructor(x:number, y:number){
        super(x, y, 1);
    }
    get():number{
        return this.inputs[0].get();
    }
}

export class NoteInput extends Node {
    constructor(x:number, y:number, public track:Track, public mix:Mix, public osc:Mapping){
        super(x, y, 0);
    }
    get():number{
        const SPS = this.mix.sampleRate/this.mix.bpm*120/8;
        const founded:Note[] = this.findNote(this.mix.playback/SPS);
        if (founded.length == 0) return 0;
        let sum:number = 0;
        for (let note of founded){
            const t = this.mix.sampleRate/note.getFrequency();
            sum += this.osc.getSample((this.mix.playback-note.start*SPS) % t / t);
        }
        // console.log(sum/founded.length);
        return sum/founded.length;
    }
    private findNote(rel_time:number):Note[] {
        for (let score of this.track.scores) {  
            if (score.absolute_start <= rel_time && rel_time < score.absolute_start + score.duration) {
                rel_time -= score.absolute_start;
                return score.getNotesAt(rel_time); 
            }
        }      
        return [];
    }
}

export class SumNode extends Node {
    constructor(x:number, y:number){
        super(x, y, 0);
    }
    get():number{
        let sum = 0;
        for (let input of this.inputs){
            sum += input.get();
        }
        return sum/this.inputs.length;
    }
    addInput(connected:Output){
        if (connected instanceof OutputSignal){
            const input = new InputSignal(this);
            input.connected = connected;
            this.inputs.push(input);
        }
    }
}

export class MixNode extends Node {
    dryWet:number = 0.5;
    constructor(x:number, y:number){
        super(x, y, 2);
    }
    get(){
        return this.inputs[0].get()*this.dryWet + this.inputs[1].get()*(1-this.dryWet);
    }
}

export class DelayNode extends Node {
    windowLenght = 44100;
    constructor(x:number, y:number){
        super(x, y, 1);
        this.window.fill(0, 0, this.windowLenght)
    }
    get(){
        this.window.push(this.inputs[0].get());
        return this.window.shift();
    }
}