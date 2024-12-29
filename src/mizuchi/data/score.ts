import Note from "../classes/note";
import Selection from "../classes/selection";

export default class Score {
    notes:Note[] = [];
    lowest_note: number = 16;
    selection: Selection = new Selection;
    constructor(public absolute_start:number, 
        public duration:number = 32, 
        public loop_duration:number = 32, 
        public relative_start:number = 0){
    }
    create(notes:Note[]) {
        for (let new_note of notes){
            this.notes.push(new_note);
            this.update(new_note);
        }
        // this.sort();
        // this.update();
    }
    // private sort(){
    //     this.notes.sort((a, b) => {
    //         return a.start - b.start;
    //     });
    // }
    private update(new_note:Note) {
        for (let i = 0; i < this.notes.length; i++){
            if (new_note.start < this.notes[i].start && new_note.start + new_note.duration > this.notes[i].start && new_note.pitch == this.notes[i].pitch){
                this.notes.splice(i, 1);
            }
        }
    }
    addScore(score:Score){
        const scoreDelt = this.absolute_start-score.absolute_start
        score.notes.forEach(note => {
            this.notes.push(new Note(note.pitch, note.start+this.duration+scoreDelt, note.duration));
        }); 
        this.duration = score.duration+scoreDelt;
        // this.sort();
    }
    move(s:Selection, [start=0,duration=0,pitch=0]:number[],reverse:boolean){
        if (reverse){
            start*=-1;
            duration*=-1;
            pitch*=-1;
        }
        s.start+=start;
        s.end+=start;
        for (let note of s.elements){
            note.start += start;
            note.duration += duration;
            note.pitch += pitch;
            this.update(note);
        }
        // this.sort();
    }
    delete(notes:Note[]) {
        notes.forEach(note => {
            this.notes.splice(this.notes.indexOf(note), 1);
        });
    }
    select(notes:Note[],start:number,end:number){
        console.log(start,end);
        
        if (this.selection.elements.length == 0){
            this.selection.start = Math.min(start,end);
            this.selection.end = Math.max(start,end)+1;
        } else {
            this.selection.start = Math.min(this.selection.start, notes[0].start);
            this.selection.end = Math.max(this.selection.end, notes[0].start);
        }
        for (let note of notes){
            if (this.selection.elements.includes(note)) {  
                this.selection.elements.splice(this.selection.elements.indexOf(note), 1);
                this.selection.start = Math.min(this.selection.start, note.start);
                this.selection.end = Math.max(this.selection.end, note.start+note.duration);
            } else {
                this.selection.start = Math.min(this.selection.start, note.start);
                this.selection.end = Math.max(this.selection.end, note.start+note.duration);
                this.selection.elements.push(note);
            }
        }
        if (this.selection.elements.length == 0){
            this.selection.start = 0;
            this.selection.end = 0;
        }
    }
    clone(){
        let score = new Score(this.absolute_start, this.duration);
        score.notes = this.notes.map(note => new Note(note.pitch, note.start, note.duration));
        return score;
    }
    getNotes(start:number = 0):Note[]{
        const notes:Note[] = [];
        for (let i = 0; i < Math.ceil(this.duration/this.loop_duration); i++){
            for (let note of this.notes){
                // if (note.start + i*this.loop_duration < this.duration){
                //     notes.push(new Note(note.pitch, note.start+start+this.loop_duration*i, note.duration));
                // }
                if (note.start < this.relative_start && note.start + (i+1)*this.loop_duration - this.relative_start < this.duration) {
                    notes.push(new Note(note.pitch, note.start+start+this.loop_duration*(i+1)-this.relative_start, note.duration));
                } 
                else if (note.start + i*this.loop_duration - this.relative_start < this.duration && (this.duration > this.loop_duration || note.start >= this.relative_start)) {
                    notes.push(new Note(note.pitch, note.start+start-this.relative_start+this.loop_duration*i, note.duration));
                }
            }
        } return notes;
    }
}