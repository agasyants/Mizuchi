import Score from "./score";
import Note from "../classes/note";
import Node, { OutputNode } from "../classes/node";
import IdComponent, { IdArray } from "../classes/id_component";
import Mix from "./mix";

export default class Track extends IdComponent {
    name:string;
    nodes = new IdArray<Node>();
    outputNode:Node = new OutputNode(0,0,0,this);
    scores = new IdArray<Score>();
    renderHeight:number = 1;
    constructor(name:string, parent:Mix, id:number) { 
        super(id,"t");
        this.parent = parent;
        this.name = name;
    }
    toJSON(){
        return {
            name: this.name,
            id: this.id,
            renderHeight: this.renderHeight,
            nodes: this.nodes,
            scores: this.scores
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
}
