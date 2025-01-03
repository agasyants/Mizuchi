import OscFunction from "../data/osc_function";

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
        if (sample>=0) return [Math.pow(sample,1.1-this.gain)];
        return [-Math.pow(-sample,1.1-this.gain)];
    }
}

export class Distortion2 extends AudioEffect{
    gain:number;
    constructor(dry:number, gain:number){
        super("Distortion2", 1);
        this.dry=dry;
        this.gain=gain;
    }
    process(sample:number){
        if (sample>=0) return [1-Math.pow(sample,this.gain+1)];
        return [Math.pow(-sample,this.gain+1)-1];
    }
}

export class Distortion3 extends AudioEffect{
    constructor(public dry:number, public f:OscFunction){
        super("Distortion Pro", 1);
        this.dry=dry;
    }
    process(sample:number){
        return [this.f.getSample((super.clip(sample)+1)/2)*2-1];
    }
}

export class Smothstep extends AudioEffect {
    constructor(dry:number){
        super("Smothstep", 1);
        this.dry=dry;
    }
    process(sample:number){
        if (sample>=0) return [3*Math.pow(sample,2)-2*Math.pow(sample,3)];
        return [-(3*Math.pow(sample,2)-2*Math.pow(sample,3))];
    }

}


export class Delay extends AudioEffect {
    delayBuffer:Array<number>;
    constructor(dry:number, delayTime:number, sampleRate:number){
        super("Delay", delayTime);
        this.dry = dry;
        this.delayBuffer = new Array(Math.floor(delayTime*sampleRate));
        this.delayBuffer.fill(0);
    }
    getStart(){
        return this.delayBuffer;
    }
    process(sample:number){
        return [sample/2];
    }
}