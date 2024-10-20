import Note from "./note";

export default class Score {
    notes:Note[] = []
    constructor(public length:number = 32){}
    addNotes(notes:Note[]) {
        notes.forEach(note => {
            this.notes.push(note);
        });
        this.sort();
    }
    sort(){
        this.notes.sort((a, b) => {
            return a.start - b.start;
        });
    }
    addScore(score:Score){
        score.notes.forEach(note => {
            this.notes.push(new Note(note.pitch, note.start+this.length, note.duration));
        }); this.length += score.length;
        this.sort();
    }
}