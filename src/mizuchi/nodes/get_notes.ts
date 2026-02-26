import Note from "../classes/note";
import { OutputMultiFloat } from "../classes/Output";
import Mix from "../data/mix";
import Track from "../data/track";
import View from "../drawers/view";
import Node from "../nodes/node";

export default class GetNotes extends Node {
    mix:Mix;
    track:Track|null = null;
    constructor(x:number, y:number, mix:Mix, id:number){
        super(id, x, y, 100, 150, "NOTE INPUT");
        this.inputs = [];
        this.outputs = [new OutputMultiFloat("freqs", 0, 0, this)];
        this.mix = mix;
    }
    render(view:View){
        this._render(view);
    }
    findByFullID(fullID:string) {
        if (fullID.length==0) return this;
        return null;
    }
    compute() {
        const SPS = this.mix.sampleRate/this.mix.bpm*120/8;
        const founded:Note[] = this.findNote(this.mix.playback/SPS);
        if (founded.length == 0) return 0;
        let freqs = []
        for (let note of founded){
            freqs.push(note.getFrequency());
        }
        this.outputs[0].cache = freqs;
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
        if (this.track == null) {
            // console.error("track==null!!!")
            return super.returnJSON();
        }
        return {
            ...super.returnJSON(),
            track: this.track.getFullId()
        }; 
    }
    setTrack(track: Track) {
        this.track = track;
    }
    static fromJSON(json:any, mix:Mix): GetNotes {
        const node = new GetNotes(json.x, json.y, mix, json.id);
        mix.setAsideFullID(json.track, (track) => {
            node.track = track;
        });
        
        return node;
    }
}