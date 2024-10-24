import Track from "./track";

export default class Mix{
    tracks:Track[] = [];
    constructor(public bpm:number){
    }
    addTrack(track:Track){
        this.tracks.push(track);
    }
    mixTracks(sampleRate:number):Float32Array{
        let min_lenght = 0;
        this.tracks.forEach(track => { 
            track.generate(this.bpm,sampleRate);
            if (track.wave.length < min_lenght || min_lenght == 0)
                min_lenght = track.wave.length;
        });
        let mixed = new Float32Array(min_lenght);
        for (let i = 0; i < min_lenght; i++){
            let sum = 0;
            for (let j = 0; j < this.tracks.length; j++){
                sum += this.tracks[j].wave[i];
            } mixed[i] = sum/this.tracks.length;
        } 
        return mixed;
    }
}