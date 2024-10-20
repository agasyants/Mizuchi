export default class Note {
    pitch:number;
    constructor(pitch:number|string, public start:number, public duration:number) {
        if (typeof pitch === 'string') {
            this.pitch = Note.pitchToNumber(pitch);
        }
        else{
            this.pitch = pitch;
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
}