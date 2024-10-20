export default class Note {
    constructor(public pitch:number, public start:number, public duration:number) {}
    getFrequency():number{
        return 440 * Math.pow(2, this.pitch/12);
    }
}