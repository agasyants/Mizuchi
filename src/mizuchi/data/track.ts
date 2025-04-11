import Score from "./score";
import Note from "../classes/note";
import IdComponent, { IdArray } from "../classes/id_component";
import Mix from "./mix";
import Mapping from "./mapping_function";
import { BasicPoint, HandlePoint } from "./function";
import NodeSpace from "../nodes/node_space";
import Node from "../nodes/node";
import NoteInput from "../nodes/note_input_node";

export default class Track extends IdComponent {
    name:string;
    nodeSpace:NodeSpace = new NodeSpace(0,0,0,this);
    scores = new IdArray<Score>();
    renderHeight:number = 1;
    static getSeparator(){ return 't';}
    constructor(name:string, parent:Mix|null, id:number) {
        super(id, Track.getSeparator(), parent);
        this.name = name;
        const mapping = new Mapping(0, 1,-1, 1, 0, [new BasicPoint(0,0,0), new BasicPoint(0.25,1,1), new BasicPoint(0.75,-1,2), new BasicPoint(1,0,3)], [new HandlePoint(0.125,0.5,0), new HandlePoint(0.5,0,1), new HandlePoint(0.875,-0.5,2)]);
        mapping.basics.increment = mapping.basics.length;
        mapping.handles.increment = mapping.handles.length;
        const node = new NoteInput(0, 0, this.parent, mapping, 1);
        this.nodeSpace.add(node)
        this.nodeSpace.connectNodes(node, this.nodeSpace.outputNode, 0);
    }
    returnJSON(){
        return {
            sep: Track.getSeparator(),
            name: this.name,
            id: this.id,
            renderHeight: this.renderHeight,
            nodeSpace: this.nodeSpace,
            scores: this.scores,
        }
    }
    findByFullID(fullID:string) {
        if (!fullID) return this;
        if (fullID.startsWith(Score.getSeparator())){
            fullID = fullID.slice(Score.getSeparator().length);
            const index = parseInt(fullID, 10)
            // console.log(fullID, index, this.scores, fullID.slice(String(index).length).length)
            return this.findByID(this.scores, index).findByFullID(fullID.slice(String(index).length));
        } 
        else if (fullID.startsWith(Node.getSeparator())){
            fullID = fullID.slice(Node.getSeparator().length);
            const index = parseInt(fullID, 10)
            return this.findByID(this.nodeSpace.nodes, index).findByFullID(fullID.slice(String(index).length));
        }
        // console.error('track', fullID);
        return null;
    }
    static fromJSON(json: any, parent: Mix|null, mix:Mix): Track {
        const track = new Track(json.name, parent, json.id);
        track.renderHeight = json.renderHeight;
        track.nodeSpace = NodeSpace.fromJSON(json.nodeSpace, track, mix);
        const scores = []
        for (let score of json.scores.data)
            scores.push(Score.fromJSON(score, track));
        track.scores = IdArray.fromJSON(scores, json.scores.increment);
        return track;
    }
    updateFromJSON(json: any) {
        this.name = json.name;
        this.renderHeight = json.renderHeight;
        this.nodeSpace = NodeSpace.fromJSON(json.nodeSpace, this, this.parent);
        const scores = []
        for (let score of json.scores.data)
            scores.push(Score.fromJSON(score, this));
        this.scores = IdArray.fromJSON(scores, json.scores.increment);
    }
    create(score:Score, index:number) {
        score.parent = this;
        this.scores.splice(index, 0, score);
    }
    delete(score:Score, index:number) {
        const new_score = this.scores.splice(index, 1)[0];
        score.parent = null;
        if (new_score != score) console.error("score don't fits index");
    }
    getFullScore():Note[] {
        let full_score:Note[] = [];
        for (let score of this.scores){
            full_score = full_score.concat(score.getNotes(score.absolute_start));
        } 
        return full_score;
    }
    clone():Track {
        const newTrack = new Track(this.name, this.parent, -1);
        newTrack.renderHeight = this.renderHeight;
        newTrack.nodeSpace = this.nodeSpace.clone();
        for (let score of this.scores){
            const s = score.clone();
            s.parent = newTrack;
            newTrack.scores.push(s);
        }
        return newTrack;
    }
}
