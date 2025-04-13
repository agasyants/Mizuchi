import IdComponent from "../classes/id_component";

export class Point extends IdComponent{
    x:number; 
    y:number;
    constructor(x:number,y:number,id:number){
        super(id, "p", null);
        this.x = x;
        this.y = y;
    }
    returnJSON() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
        };
    }
    findByFullID(fullID:string) {
        if (fullID.length==0) return this;
        console.error('point', fullID);
        return null;
    }
    static fromJSON(json: any): Point {
        return new Point(json.x, json.y, json.id);
    }
    getLength(x:number, y:number):number{
        return Math.sqrt(Math.pow(this.x-x, 2) + Math.pow(this.y-y, 2));
    }
    clone():Point{
        return new Point(this.x, this.y, -1);
    }
}

export class BasicPoint extends Point{
    x_move:boolean;
    y_move:boolean;
    constructor(x:number, y:number, id:number, x_move:boolean=true, y_move:boolean=true){
        super(x, y, id);
        this.x_move = x_move;
        this.y_move = y_move;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            x_move: this.x_move,
            y_move: this.y_move,
        };
    }
    static fromJSON(json: any): BasicPoint {
        return new BasicPoint(json.x, json.y, json.id, json.x_move, json.y_move);
    }
    clone():BasicPoint{
        return new BasicPoint(this.x, this.y, -1, this.x_move, this.y_move);
    }
}

export class HandlePoint extends Point{
    xl:number;
    yl:number;
    constructor(x:number, y:number, id:number, xl:number = 0.5, yl:number = 0.5){
        super(x, y, id);
        this.xl = xl;
        this.yl = yl;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            xl: this.xl,
            yl: this.yl,
        };
    }
    static fromJSON(json: any): HandlePoint {
        return new HandlePoint(json.x, json.y, json.id, json.xl, json.yl);
    }
    clone():HandlePoint{
        return new HandlePoint(this.x, this.y, -1, this.xl, this.yl);
    }
}