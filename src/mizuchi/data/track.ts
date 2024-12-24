import Score from "./score";
import Note from "../classes/note";
// import AudioEffect from "../classes/audio_effects";
import Node, { OutputNode } from "../classes/node";

export default class Track {
    name:string;
    nodes:Node[]=[];
    outputNode:Node = new OutputNode(0,0);
    scores:Score[] = [];
    renderHeight:number = 1;
    // scoreEffects:ScoreEffect[] = [];
    constructor(name:string) { 
        this.name = name;
    }
    addScore(score:Score){
        this.scores.push(score);
    }
    delete(score:Score){
        this.scores = this.scores.filter((s)=>s!=score);
    }
    getFullScore():Note[] {
        let full_score:Note[] = [];
        for (let score of this.scores){
            full_score = full_score.concat(score.getNotes(score.absolute_start));
        } 
        return full_score;
    }
}
