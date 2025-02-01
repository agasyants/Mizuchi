import Score from "../data/score"
import Track from "../data/track"

export default class hovered{
    elements:any[] = [];
    start:boolean = false;
    end:boolean = false;
}

export class HoveredMix {
    scores:Score[] = [];
    pos:number[] = [];
    track:Track|null = null;
    start:boolean = false;
    end:boolean = false;
}