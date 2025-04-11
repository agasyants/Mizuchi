import Note from "../classes/note";
import Mapping from "../data/mapping_function";
import Mix from "../data/mix";
import Track from "../data/track";
import View from "../drawers/view";
import Node from "../nodes/node";

export default class NoteInput extends Node {
    mix:Mix;
    osc:Mapping;
    track:Track|null = null;
    constructor(x:number, y:number, mix:Mix, osc:Mapping, id:number){
        super(id, x, y, 100, 150, [], 'Note Input', parent);
        this.mix = mix;
        this.osc = osc;
    }
    render(view:View){
        this._render(view);
    }
    findByFullID(fullID:string) {
        if (fullID.length==0) return this;
        return null;
    }
    get():number {
        const SPS = this.mix.sampleRate/this.mix.bpm*120/8;
        const founded:Note[] = this.findNote(this.mix.playback/SPS);
        if (founded.length == 0) return 0;
        let sum:number = 0;
        for (let note of founded){
            const t = this.mix.sampleRate/note.getFrequency();
            sum += this.osc.getSample((this.mix.playback-note.start*SPS) % t / t);
        }
        return sum/founded.length;
    }
    private findNote(rel_time:number): Note[] {
        if (this.track == null) return [];
        for (let score of this.track.scores) {  
            if (score.absolute_start <= rel_time && rel_time < score.absolute_start + score.duration) {
                rel_time -= score.absolute_start;
                return score.getNotesAt(rel_time); 
            }
        }
        return [];
    } 
    returnJSON() {
        if (this.track == null) return super.returnJSON();
        return {
            ...super.returnJSON(),
            osc: this.osc,
            track: this.track.getFullId()
        }; 
    }
    static fromJSON(json:any, mix:Mix): NoteInput {
        const node = new NoteInput(json.x, json.y, mix, json.osc, json.id);
        mix.setAsideFullID(json.track, node.track)
        node.window = json.window;
        return node;
    }
}