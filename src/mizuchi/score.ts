import Note from "./note";

export default class Score {
    notes:Note[] = [];
    start_note: number = 16;
    loop_guration: number = 64;
    selection: Selection = new Selection;
    constructor(public start_time:number, public duration:number = 32){}
    create(notes:Note[]) {
        for (let new_note of notes){
            this.notes.push(new_note);
            this.update(new_note);
        }
        this.sort();
        // this.update();
    }
    private sort(){
        this.notes.sort((a, b) => {
            return a.start - b.start;
        });
    }
    private update(new_note:Note) {
        for (let i = 0; i < this.notes.length; i++){
            if (new_note.start < this.notes[i].start && new_note.start + new_note.duration > this.notes[i].start){
                this.notes.splice(i, 1);
            }
        }
        
    }
    addScore(score:Score){
        const scoreDelt = this.start_time-score.start_time
        score.notes.forEach(note => {
            this.notes.push(new Note(note.pitch, note.start+this.duration+scoreDelt, note.duration));
        }); 
        this.duration = score.duration+scoreDelt;
        this.sort();
    }
    move(s:Selection, [start=0,duration=0,pitch=0]:number[]){
        s.start+=start;
        s.end+=start;
        for (let note of s.notes){
            note.start += start;
            note.duration += duration;
            note.pitch += pitch;
            this.update(note);
        }
        this.sort();
    }
    delete(notes:Note[]) {
        notes.forEach(note => {
            this.notes.splice(this.notes.indexOf(note), 1);
        });
    }
    select(start:number, end:number){
        this.selection.start = start;
        this.selection.end = end;
        for (let note of this.notes){
            if (note.start >= start && note.start+note.duration <= end){
                this.selection.notes.push(note);
            }
        }
    }
}

export class Selection {
    start:number;
    end:number;
    notes:Note[];
    offset_pitch:number = 0;
    offset_start:number = 0;
    offset_duration:number = 0;
    drugged_x:number = 0;
    drugged_y:number = 0;
    constructor(start:number=0, end:number=0){
        this.start = start;
        this.end = end;
        this.notes = [];
    }
    clone(){
        let clone = new Selection();
        clone.start = this.start;
        clone.end = this.end;
        for (let note of this.notes){
            clone.notes.push(note.clone());
        }
        return clone;
    }
    cloneNotes(){
        let clone = [];
        for (let note of this.notes){
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
}