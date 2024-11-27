import Note from "./note";
import Selection from "./selection";

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
            if (new_note.start < this.notes[i].start && new_note.start + new_note.duration > this.notes[i].start && new_note.pitch == this.notes[i].pitch){
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
        for (let note of s.selected){
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
                this.selection.selected.push(note);
            }
        }
    }
}