import Note from "./note";

export default class Score {
    notes:Note[] = []
    constructor(public start_time:number, public duration:number = 32){}
    addNotes(notes:Note[]) {
        notes.forEach(note => {
            this.notes.push(note.clone());
        });
        this.sort();
        this.update();
    }
    private sort(){
        this.notes.sort((a, b) => {
            return a.start - b.start;
        });
    }
    private update() {
        let i = 0;
        while (i < this.notes.length - 1) {
            if (this.notes[i].pitch === this.notes[i + 1].pitch) {
                if (this.notes[i].start === this.notes[i + 1].start) {
                    this.notes.splice(i + 1, 1);
                    continue;
                }
    
                if (this.notes[i].start + this.notes[i].duration > this.notes[i + 1].start) {
                    this.notes[i].duration = this.notes[i + 1].start - this.notes[i].start;
                }
            }
    
            if (this.notes[i].start + this.notes[i].duration > this.duration) {
                this.notes[i].duration = this.duration - this.notes[i].start;
            }
    
            i++;
        }
    
        let lastNote = this.notes[this.notes.length - 1];
        if (lastNote.start + lastNote.duration > this.duration) {
            lastNote.duration = this.duration - lastNote.start;
        }
    }
    addScore(score:Score){
        const scoreDelt = this.start_time-score.start_time
        score.notes.forEach(note => {
            this.notes.push(new Note(note.pitch, note.start+this.duration+scoreDelt, note.duration));
        }); this.duration = score.duration+scoreDelt;
        this.sort();
    }
    removeNotes(notes:Note[]) {
        notes.forEach(note => {
            this.notes.splice(this.notes.indexOf(note), 1);
        });
    }
}