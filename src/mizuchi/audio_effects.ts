
export default class AudioEffect{
    public name:string;
    public dry:number=1;
    public windowLength:number;
    constructor(name:string,windowLength:number){
        this.name=name;
        this.windowLength=windowLength;
    }
    process(sample:number){
        return [sample];
    }
    clip(sample:number){
        return Math.max(-1, Math.min(1, sample));
    }
}


export class Distortion extends AudioEffect{
    gain:number;
    constructor(dry:number, gain:number){
        super("Distortion", 1);
        this.dry=dry;
        this.gain=gain;
    }
    process(sample:number){
        return [sample*(1-this.dry) + this.distort(sample)*this.dry];
    }
    distort(sample:number){
        return super.clip(sample*this.gain);
    }
}

export class Flanger extends AudioEffect {

}


export class Delay extends AudioEffect {
    delayBuffer:Array<number>;
    delayIndex:number=0;
    constructor(dry:number, delayTime:number, sampleRate:number){
        super("Delay", delayTime);
        this.dry=dry;
        this.delayBuffer=new Array(Math.floor(delayTime*sampleRate));
    }
    process(sample:number){
        this.delayBuffer[this.delayIndex] = sample*(1-this.dry);
        this.delayBuffer[this.delayIndex]=sample*this.dry/2;
        return this.delayBuffer;
    }
}