import Score from "./score";
import Track from "./track";

export default class Mix{
    chunks:Float32Array[] = [];
    chunksLength:number = 40000;
    tracks:Track[] = [];
    constructor(public bpm:number){
        this.addTrack();
    }
    addTrack(){
        this.tracks.push(new Track('track '+ (this.tracks.length+1).toString()));
        for (let i = 0; i < 4; i++){
            this.tracks[this.tracks.length-1].scores.push(new Score);
        }
    }
    removeTrack(track:Track){
        let index = this.tracks.indexOf(track);
        if (index > -1) this.tracks.splice(index, 1);
    }
    mixTracks(sampleRate:number):Float32Array{
        let min_lenght = 0;
        this.tracks.forEach(track => { 
            track.generate(this.bpm,sampleRate);
            if (track.wave.length < min_lenght || min_lenght == 0)
                min_lenght = track.wave.length;
        });
        let mixed = new Float32Array(min_lenght);
        let max = 0;
        for (let i = 0; i < min_lenght; i++){
            let sum = 0;
            for (let j = 0; j < this.tracks.length; j++){
                sum += this.tracks[j].wave[i];
            } 
            if (Math.abs(sum) > max) max = Math.abs(i);
            mixed[i] = sum;
        } 
        for (let i = 0; i < mixed.length; i++){
            mixed[i] /= max;
        }
        return mixed;
    }
}