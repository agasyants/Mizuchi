import IdComponent from "../classes/id_component";
import Curve from "./curve";
import Mapping from "./mapping_function";

export class Point extends IdComponent{
    x:number; 
    y:number;
    constructor(parent:Curve|Function|Mapping, x:number, y:number, id:number){
        super(id, "p", parent);
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
    static fromJSON(json: any, parent: any): Point {
        return new Point(json.x, json.y, json.id, parent);
    }
    getLength(x:number, y:number):number{
        return Math.sqrt(Math.pow(this.x-x, 2) + Math.pow(this.y-y, 2));
    }
    clone():Point {
        return new Point(this.parent, this.x, this.y, -1);
    }
}

export class BasicPoint extends Point{
    x_move:boolean;
    y_move:boolean;
    constructor(parent: any, x:number, y:number, id:number, x_move:boolean=true, y_move:boolean=true){
        super(parent, x, y, id);
        this.x_move = x_move;
        this.y_move = y_move;
    }
    returnJSON() {
        return {
            ...super.returnJSON(),
            x_move: this.x_move,
            y_move: this.y_move,
        };
    }
    static fromJSON(json: any): BasicPoint {
        return new BasicPoint(null, json.x, json.y, json.id, json.x_move, json.y_move);
    }
    clone():BasicPoint{
        return new BasicPoint(this.parent, this.x, this.y, -1, this.x_move, this.y_move);
    }
}

export class HandlePoint extends Point{
    xl:number;
    yl:number;
    constructor(parent:any, x:number, y:number, id:number, xl:number = 0.5, yl:number = 0.5){
        super(parent, x, y, id);
        this.xl = xl;
        this.yl = yl;
    }
    returnJSON() {
        return {
            ...super.returnJSON(),
            xl: this.xl,
            yl: this.yl,
        };
    }
    static fromJSON(json: any): HandlePoint {
        return new HandlePoint(null, json.x, json.y, json.id, json.xl, json.yl);
    }
    clone():HandlePoint{
        return new HandlePoint(this.parent, this.x, this.y, -1, this.xl, this.yl);
    }
}