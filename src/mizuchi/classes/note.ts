import Score from "../data/score";
import IdComponent from "./id_component";

export default class Note extends IdComponent {
    pitch:number;
    start:number;
    duration:number;
    constructor(pitch:number|string, start:number, duration:number, id:number, parent:Score|null=null) {
        super(id,"nt");
        this.parent = parent;
        if (typeof pitch === 'string') {
            this.pitch = Note.pitchToNumber(pitch);
        }
        else{
            this.pitch = pitch;
        }
        this.start = start;
        this.duration = duration;
    }
    toJSON() {
        return {
            pitch: this.pitch,
            start: this.start,
            duration: this.duration
        }
    }
    getFrequency():number{
        return 440 * Math.pow(2, (this.pitch - 69) / 12);
    }
    static pitchToNumber(pitch:string):number{
        const noteMap:{[key:string]:number} = {
            'C': 0,
            'C#': 1,
            'D': 2,
            'D#': 3,
            'E': 4,
            'F': 5,
            'F#': 6,
            'G': 7,
            'G#': 8,
            'A': 9,
            'A#': 10,
            'B': 11
        };
        const octave = parseInt(pitch.slice(-1));
        const note = pitch.slice(0, -1);
        return octave * 12 + noteMap[note];
    }
    static numberToPitch(num:number):string{
        const noteMap = [
            'C',
            'C#',
            'D',
            'D#',
            'E',
            'F',
            'F#',
            'G',
            'G#',
            'A',
            'A#',
            'B'
        ];
        const octave = Math.floor(num/12).toString();
        const note = num%12;
        return octave + noteMap[note];
    }
    clone():Note{
        return new Note(this.pitch, this.start, this.duration, -1);
    }
}