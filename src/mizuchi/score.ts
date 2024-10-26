import Note from "./note";

export default class Score {
    notes:Note[] = []
    constructor(public duration:number = 32){}
    addNotes(notes:Note[]) {
        notes.forEach(note => {
            this.notes.push(note);
        });
        this.sort();
        this.update();
    }
    sort(){
        this.notes.sort((a, b) => {
            return a.start - b.start;
        });
    }
    update() {
        let i = 0;
        while (i < this.notes.length - 1) {
            if (this.notes[i].pitch === this.notes[i + 1].pitch) {
                if (this.notes[i].start === this.notes[i + 1].start) {
                    this.notes.splice(i + 1, 1); // Удаляем следующий элемент и остаёмся на той же позиции i
                    continue; // Пропускаем увеличение i, чтобы снова проверить текущий элемент
                }
    
                // Проверка и обрезка длительности, если ноты накладываются
                if (this.notes[i].start + this.notes[i].duration > this.notes[i + 1].start) {
                    this.notes[i].duration = this.notes[i + 1].start - this.notes[i].start;
                }
            }
    
            // Проверка, не выходит ли текущая нота за пределы this.duration
            if (this.notes[i].start + this.notes[i].duration > this.duration) {
                this.notes[i].duration = this.duration - this.notes[i].start;
            }
    
            i++; // Переход к следующей ноте
        }
    
        // Проверка последней ноты на выход за пределы this.duration
        let lastNote = this.notes[this.notes.length - 1];
        if (lastNote.start + lastNote.duration > this.duration) {
            lastNote.duration = this.duration - lastNote.start;
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