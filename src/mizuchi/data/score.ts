import IdComponent, { IdArray } from "../classes/id_component";
import Note from "../classes/note";
import { NoteSelection } from "../classes/selection";
import Track from "./track";

export default class Score extends IdComponent {
    parent: Track;
    notes:IdArray<Note> = new IdArray<Note>()
    lowest_note: number = 16;
    selection:NoteSelection = new NoteSelection();
    constructor(parent:Track, id:number, public absolute_start:number, public duration:number = 32, public loop_duration:number = 32, public relative_start:number = 0){
        super(id, "nd");
        this.parent = parent;
    }
    toJSON() {
        return {
            id: this.id,
            lowest_note: this.lowest_note,
            absolute_start: this.absolute_start,
            duration: this.duration,
            loop_duration: this.loop_duration,
            relative_start: this.relative_start,
            notes: this.notes
        };
    }
    create(notes:Note[]){
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
    // addScore(score:Score){
    //     const scoreDelt = this.absolute_start-score.absolute_start
    //     score.notes.forEach(note => {
    //         this.notes.push(new Note(note.pitch, note.start+this.duration+scoreDelt, note.duration, ));
    //     }); 
    //     this.duration = score.duration+scoreDelt;
    //     this.sort();
    // }
    move(s:NoteSelection, [start=0,duration=0,pitch=0]:number[], reverse:boolean){
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
        this.sort();
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
            this.selection.end = Math.max(start,end) + 1;
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
    clone(new_parent:Track|null=null){
        let parent;
        if (new_parent)
            parent = new_parent;
        else
            parent = this.parent;
        const score = new Score(parent, parent.scores.getNewId(), this.absolute_start, this.duration, this.loop_duration, this.relative_start);
        for (let note of this.notes){
            score.notes.push(new Note(note.pitch, note.start, note.duration, note.id, this));
        }
        return score;
    }
    getNotes(start:number = 0):Note[]{
        const notes:Note[] = [];
        for (let i = 0; i < Math.ceil(this.duration/this.loop_duration); i++){
            for (let note of this.notes) {
                if (note.start >= this.loop_duration) continue;
                if (note.start < this.relative_start && note.start + (i+1)*this.loop_duration - this.relative_start < this.duration) {
                    notes.push(new Note(note.pitch, note.start+start+this.loop_duration*(i+1)-this.relative_start, note.duration, note.id));
                } 
                else if (note.start + i*this.loop_duration - this.relative_start < this.duration && (this.duration > this.loop_duration || note.start >= this.relative_start)) {
                    notes.push(new Note(note.pitch, note.start+start-this.relative_start+this.loop_duration*i, note.duration, note.id));
                }
            }
        } return notes;
    }
    getNotesAt(currentTime: number): Note[] {
        const activeNotes: Note[] = [];
    
        let relativeTime = currentTime + this.relative_start; 
        if (this.loop_duration !== undefined) {
            if (relativeTime < 0) return activeNotes;
            relativeTime %= this.loop_duration;
        } else {
            if (relativeTime < 0 || relativeTime > this.duration) return activeNotes;
        }
    
        for (const note of this.notes) { 
            const noteStart = note.start; 
            if (noteStart <= relativeTime && relativeTime < noteStart + note.duration) { 
                activeNotes.push(new Note(note.pitch, note.start-this.absolute_start-this.relative_start, note.duration, note.id)); 
                // console.log(note); 
            }
        }
        return activeNotes;
    }
}