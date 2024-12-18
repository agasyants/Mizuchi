import Score from "../data/score";
import Track from "../data/track";

export default class Selection {
    start:number;
    end:number;
    elements:any[]=[];
    offset:{start:number, duration:number, pitch:number} = {start:0, duration:0, pitch:0};
    drugged_x:number = 0;
    drugged_y:number = 0;
    constructor(start:number=0, end:number=0){
        this.start = start;
        this.end = end;
    }
    clone(){
        let clone = new Selection();
        clone.start = this.start;
        clone.end = this.end;
        for (let el of this.elements){
            clone.elements.push(el.clone());
        }
        return clone;
    }
    cloneContent(){
        let clone = [];
        for (let element of this.elements){
            clone.push(element.clone());
        }
        return clone;
    }
    clear(){
        this.offset.pitch = 0;
        this.offset.start = 0;
        this.offset.duration = 0;
        this.drugged_x = 0;
        this.drugged_y = 0;
    }
    getLast(){
        return this.elements[this.elements.length-1];
    }
    isShifted(){
        return this.offset.pitch || this.offset.start || this.offset.duration;
    }
}

export class NoteSelection extends Selection {
    constructor(){
        super();
    }
}

export class ScoreSelection extends Selection {
    elements:Score[] = [];
    track_index:number[] = [];
    offset:{start:number, duration:number, loop_duration:number, pitch:number, rel:number} = {start:0, duration:0, loop_duration:0, pitch:0, rel:0};
    min:number = 0;
    max:number = 0;
    constructor(){
        super();
    }
    set(score:Score[], index:number[]){
        this.elements = score;
        this.track_index = index;
        this.min = Math.min(...index);
        this.max = Math.max(...index);
    }
    add(score:Score, index:number){
        this.elements.push(score);
        this.track_index.push(index);
        this.min = Math.min(this.min, index);
        this.max = Math.max(this.max, index);
    }
}

export class TrackSelection extends Selection {
    elements:Track[] = [];
    index:number[] = [];
    constructor(){
        super();
    }
}