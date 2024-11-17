import Note from "./note";

export default class Score {
    notes:Note[] = [];
    start_note: number = 16;
    loop_guration: number = 64;
    constructor(public start_time:number, public duration:number = 32){}
    create(notes:Note[]) {
        for (let note of notes){
            this.notes.push(note);
        }
        this.sort();
        this.update();
    }
    move(notes:Note[], x:number, y:number) {
        for (let note of notes){
            note.start += x;
            note.pitch += y;
        }
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
        }); 
        this.duration = score.duration+scoreDelt;
        this.sort();
    }
    delete(notes:Note[]) {
        notes.forEach(note => {
            this.notes.splice(this.notes.indexOf(note), 1);
        });
    }
}