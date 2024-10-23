import Note from "./note";

export default class Score {
    notes:Note[] = []
    constructor(public duration:number = 32){}
    addNotes(notes:Note[]) {
        notes.forEach(note => {
            this.notes.push(note);
        });
        this.sort();
        // this.cleaning();
    }
    sort(){
        this.notes.sort((a, b) => {
            return a.start - b.start;
        });
    }
    cleaning(){
        let i = 0;
        while (i < this.notes.length-1) {
            if (this.notes[i].pitch==this.notes[i+1].pitch){
                if (this.notes[i].start==this.notes[i+1].start){
                    this.notes.splice(i, 1);
                } else {
                    i++;
                }
                if (this.notes[i].start+this.notes[i+1].duration>this.notes[i+1].start){
                    this.notes[i].duration = this.notes[i+1].start-this.notes[i].start;
                }
            } console.log(i);
            if (this.notes[i].start+this.notes[i].duration>this.duration){
                this.notes[i].duration = this.duration-this.notes[i].start;
            }
        }
        i = this.notes.length-1;
        if (this.notes[i].start+this.notes[i].duration>this.duration){
            this.notes[i].duration = this.duration-this.notes[i].start;
        }
    }
    addScore(score:Score){
        score.notes.forEach(note => {
            this.notes.push(new Note(note.pitch, note.start+this.duration, note.duration));
        }); this.duration += score.duration;
        this.sort();
    }
    removeNotes(notes:Note[]) {
        notes.forEach(note => {
            this.notes.splice(this.notes.indexOf(note), 1);
        });
    }
}