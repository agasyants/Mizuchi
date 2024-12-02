export default class Selection {
    start:number;
    end:number;
    selected:any[];
    offset_pitch:number = 0;
    offset_start:number = 0;
    offset_duration:number = 0;
    drugged_x:number = 0;
    drugged_y:number = 0;
    constructor(start:number=0, end:number=0){
        this.start = start;
        this.end = end;
        this.selected = [];
    }
    clone(){
        let clone = new Selection();
        clone.start = this.start;
        clone.end = this.end;
        for (let note of this.selected){
            clone.selected.push(note.clone());
        }
        return clone;
    }
    cloneNotes(){
        let clone = [];
        for (let note of this.selected){
            clone.push(note.clone());
        }
        return clone;
    }
    clear(){
        this.offset_pitch = 0;
        this.offset_start = 0;
        this.offset_duration = 0;
        this.drugged_x = 0;
        this.drugged_y = 0;
    }
    getLast(){
        return this.selected[this.selected.length-1];
    }
}