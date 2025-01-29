import Score from "./score";
import Note from "../classes/note";
import { NodeSpace, NoteInput } from "../classes/node";
import IdComponent, { IdArray } from "../classes/id_component";
import Mix from "./mix";
import Mapping from "./mapping_function";
import { BasicPoint, HandlePoint } from "./function";

export default class Track extends IdComponent {
    name:string;
    nodeSpace:NodeSpace = new NodeSpace(0,0,0,this);
    scores = new IdArray<Score>();
    renderHeight:number = 1;
    constructor(name:string, parent:Mix, id:number) { 
        super(id,"t",parent);
        this.parent = parent;
        this.name = name;
        const mapping = new Mapping(0, 1,-1, 1, 0, [new BasicPoint(0,0,0), new BasicPoint(0.25,1,1), new BasicPoint(0.75,-1,2), new BasicPoint(1,0,3)], [new HandlePoint(0.125,0.5,0), new HandlePoint(0.5,0,1), new HandlePoint(0.875,-0.5,2)]);
        mapping.basics.increment = mapping.basics.length;
        mapping.handles.increment = mapping.handles.length;
        const node = new NoteInput(0, 0, this, this.parent, mapping, 1);
        this.nodeSpace.add(node)
        this.nodeSpace.connectNodes(node, this.nodeSpace.outputNode, 0);
    }
    toJSON(){
        return {
            name: this.name,
            id: this.id,
            renderHeight: this.renderHeight,
            nodeSpace: this.nodeSpace,
            scores: this.scores,
        }
    }
    addScore(score:Score){
        this.scores.push(score);
    }
    delete(score:Score){
        // probably doesn't work
        this.scores = this.scores.filter((s)=>s!=score) as IdArray<Score>;
    }
    getFullScore():Note[] {
        let full_score:Note[] = [];
        for (let score of this.scores){
            full_score = full_score.concat(score.getNotes(score.absolute_start));
        } 
        return full_score;
    }
    clone():Track {
        const newTrack = new Track(this.name, this.parent, this.id);
        newTrack.renderHeight = this.renderHeight;
        newTrack.nodeSpace = this.nodeSpace.clone();
        for (let score of this.scores){
            newTrack.scores.push(score.clone(newTrack));
        }
        return newTrack;
    }
}
