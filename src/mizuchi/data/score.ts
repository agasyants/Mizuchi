import IdComponent, { IdArray } from "../classes/id_component";
import Note from "../classes/note";
import { NoteSelection } from "../classes/selection";
import Track from "./track";

export default class Score extends IdComponent {
    notes:IdArray<Note> = new IdArray<Note>()
    lowest_note: number = 16;
    selection:NoteSelection = new NoteSelection();
    static getSeparator(){
        return 's';
    }
    constructor(parent:Track|null, id:number, public absolute_start:number, public duration:number = 32, public loop_duration:number = 32, public relative_start:number = 0){
        super(id, Score.getSeparator(), parent);
    }
    returnJSON() {
        return {
            sep: Score.getSeparator(),
            id: this.id,
            lowest_note: this.lowest_note,
            absolute_start: this.absolute_start,
            duration: this.duration,
            loop_duration: this.loop_duration,
            relative_start: this.relative_start,
            notes: this.notes
        };
    }
    findByFullID(fullID:string) {
        if (fullID.length==0) return this;
        if (fullID.startsWith(Note.getSeparator())){
            fullID = fullID.slice(Note.getSeparator().length);
            const index = parseInt(fullID, 10)
            return this.findByID(this.notes,index).findByFullID(fullID.slice(String(index).length));
        }
        console.error('score', fullID);
        return null;
    }
    static fromJSON(json: any, parent: Track|null): Score {
        const score = new Score(
            parent,
            json.id,
            json.absolute_start,
            json.duration,
            json.loop_duration,
            json.relative_start
        );
        score.lowest_note = json.lowest_note;
        const notes = []
        for (let note of json.notes.data)
            notes.push(Note.fromJSON(note, score));
        score.notes = IdArray.fromJSON(notes, json.notes.increment);
        return score;
    }
    create(notes:Note[]){
        for (let new_note of notes){
            this.notes.push(new_note);
            this.update(new_note);
        }
        this.sort();
        // this.update();
        // require rework
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
    move(notes:Note[], [start=0,duration=0,pitch=0]:number[], reverse:boolean){
        if (reverse){
            start*=-1;
            duration*=-1;
            pitch*=-1;
        }
        for (let note of notes){
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
            note.parent = null;
        });
        // require rework
    }
    select(notes:Note[],start:number,end:number){
        console.log(start,end);
        const c = this.selection;
        if (c.elements.length == 0){
            c.start = Math.min(start,end);
            c.end = Math.max(start,end) + 1;
        } else {
            c.start = Math.min(c.start, notes[0].start);
            c.end = Math.max(c.end, notes[0].start);
        }
        for (let note of notes){
            if (c.elements.includes(note)) {  
                c.elements.splice(c.elements.indexOf(note), 1);
                c.start = Math.min(c.start, note.start);
                c.end = Math.max(c.end, note.start+note.duration);
            } else {
                c.start = Math.min(c.start, note.start);
                c.end = Math.max(c.end, note.start+note.duration);
                c.elements.push(note);
            }
        }
        if (c.elements.length == 0){
            c.start = 0;
            c.end = 0;
        }
    }
    clone(new_id:number=-1){
        const score = new Score(null, new_id, this.absolute_start, this.duration, this.loop_duration, this.relative_start);
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