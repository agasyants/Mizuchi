import Oscillator from "./oscillator";
import Note from "./note";

export default class Instrument {
    osc:Oscillator;
    constructor(osc:Oscillator = new Oscillator()) {
        this.osc = osc;
    }
    play(notes:Note[], bpm:number, sampleRate:number, i:number):number {
        let SPS = sampleRate/bpm*120*0.125;
        const founded = this.findNote(notes, SPS, i);
        if (founded.length == 0) return 0;
        let sum:number = 0;
        for (let note of founded){
            sum+=this.osc.play(note, sampleRate, i, SPS);
        }
        return sum/founded.length;
    }
    private findNote(notes:Note[], SPS:number, i:number):Note[]{
        let result:Note[] = [];
        for (let note of notes){
            if (i<note.start*SPS){
                return result;
            } if (i>=note.start*SPS && i<=(note.start+note.duration)*SPS){
                result.push(note);
            } else if (i>(note.start+note.duration)*SPS){
                notes.slice(notes.indexOf(note));
            }
        } return result;
    }
}
