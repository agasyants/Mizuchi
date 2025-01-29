import IdComponent, { IdArray } from "../classes/id_component";
import Node from "../classes/node";

export default class Function extends IdComponent{
    basics = new IdArray<BasicPoint>();
    handles = new IdArray<HandlePoint>();
    x_min:number;
    x_max:number;
    y_min:number;
    y_max:number;
    constructor(x_min:number,x_max:number,y_min:number,y_max:number,basics:BasicPoint[], handles:HandlePoint[], id:number,parent:Node|null){
        super(id,"f", parent);
        this.set(basics,handles);
        this.x_min = x_min;
        this.x_max = x_max;
        this.y_min = y_min;
        this.y_max = y_max;
    }
    toJSON() {
        return {
            id: this.id,
            x_min: this.x_min,
            x_max: this.x_max,
            y_min: this.y_min,
            y_max: this.y_max,
            basics: this.basics.map(basic => basic.toJSON()),
            handles: this.handles.map(handle => handle.toJSON()),
        };
    }
    static fromJSON(json: any, parent: Node | null): Function {
        const basics = json.basics.map((basicJson: any) => BasicPoint.fromJSON(basicJson));
        const handles = json.handles.map((handleJson: any) => HandlePoint.fromJSON(handleJson));
        const func = new Function(
            json.x_min,
            json.x_max,
            json.y_min,
            json.y_max,
            basics,
            handles,
            json.id,
            parent
        );

        return func;
    }
    set(basics:BasicPoint[], handles:HandlePoint[]){
        let result = [this.basics, this.handles]
        this.basics.clear();
        this.handles.clear();
        for (let basic of basics){
            this.basics.push(basic.clone())
        }
        for (let handle of handles){
            this.handles.push(handle.clone())
        }
        return result;
    }
    move(point:Point, [x,y]:number[], reverse:boolean):void{
        if (reverse){
            x = -x;
            y = -y;
        }
        x += point.x;
        y += point.y; 
        if (point instanceof BasicPoint){
            let num = this.basics.indexOf(point);
            [x,y] = this.calcBasic(point, num, x, y);
            point.x = x;
            point.y = y;
            if (num < this.basics.length-1){
                this.setHandleAbsByRelPos(num);
            }
            if (num > 0){
                this.setHandleAbsByRelPos(num-1);
            }
        } else if (point instanceof HandlePoint) {
            let num = this.handles.findIndex((e)=>(e == point));
            [x,y] = this.calcHandle(num, x, y);
            let [xl,yl] = this.setHandleAbsPos(num, x, y);
            this.handles[num].x = x;
            this.handles[num].y = y;
            this.handles[num].xl = xl;
            this.handles[num].yl = yl;
        }
    }
    calcBasic(basic:BasicPoint, num:number, x:number, y:number){
        if (basic.x_move) {
            if (x < this.basics[num-1].x){
                x = this.basics[num-1].x;
            } else if (x > this.basics[num+1].x){
                x = this.basics[num+1].x;
            }
        } else {
            x = basic.x;
        }
        if (basic.y_move) {
            if (y < -1){
                y = -1;
            } else if (y > 1){
                y = 1;
            }
        } else {
            y = basic.y;
        }
        return [x,y];
    }
    calcHandle(num:number, x:number, y:number){
        let max_x = this.basics[num+1].x;
        let min_x = this.basics[num].x;
        if (x > max_x){
            x = max_x;
        } else if (x < min_x){
            x = min_x;
        }
        let max_y = Math.max(this.basics[num].y, this.basics[num+1].y);
        let min_y = Math.min(this.basics[num].y, this.basics[num+1].y);
        if (y > max_y){
            y = max_y;
        } else if (y < min_y){
            y = min_y;
        }
        return [x,y];
    }
    copy():[BasicPoint[], HandlePoint[]]{
        let basics = [];
        let handles = [];
        for (let basic of this.basics){
            basics.push(basic.clone())
        }
        for (let handle of this.handles){
            handles.push(handle.clone())
        }
        return [basics, handles];
    }
    getAroundPoints(point:Point){
        if (point instanceof HandlePoint){
            const num = this.handles.indexOf(point);
            return [this.basics[num], this.handles[num], this.basics[num+1]];
        } else if (point instanceof BasicPoint){
            const num = this.basics.indexOf(point);
            return [point, this.handles[num-1], this.handles[num]];
        } else {
            return [new BasicPoint(0, 0, this.basics.getNewId(), false, false), new HandlePoint(0, 0, this.handles.getNewId()), new HandlePoint(0, 0, this.handles.getNewId())];
        }
    }
    create(points:any){
        let basic = points[0];
        let handle1 = new HandlePoint(0, 0, this.handles.getNewId());
        let handle2 = new HandlePoint(0, 0, this.handles.getNewId());
        if (points.length==3){
            handle1 = points[1];
            handle2 = points[2];
        }
        for (let i = 0; i < this.basics.length-1; i++){
            if (this.basics[i].x <= basic.x && basic.x <= this.basics[i+1].x){
                this.basics.splice(i+1, 0, basic);
                this.handles.splice(i, 1, handle1, handle2);
                this.setHandleAbsByRelPos(i);
                this.setHandleAbsByRelPos(i+1);
                return;
            }
        }
    }
    delete(points:any){
        if (points.length==2){
            this.basics.clear();
            this.handles.clear()
            return;
        }
        let point = points[0];
        const num = this.basics.indexOf(point);
        this.basics.splice(num, 1);
        this.handles.splice(num-1, 2, new HandlePoint(0,0, this.handles.getNewId()));
        this.setHandleAbsByRelPos(num-1);
    }
    getItest(i:number):number{
        return (Math.acos(Math.cos(i * Math.PI*2)) - (Math.PI / 2)) / (Math.PI / 2) * 2 - 1;
    }
    setHandleAbsPos(num:number, x:number, y:number){
        let xl = 0;
        let yl = 0;
        if (x-this.basics[num].x != 0){
            xl = (x-this.basics[num].x)/(this.basics[num+1].x-this.basics[num].x);
        }
        if (y-this.basics[num].y != 0){
            yl = (y-this.basics[num].y)/(this.basics[num+1].y-this.basics[num].y);
        }
        return [xl,yl];
    }
    calcHandleAbs(basic1:BasicPoint, handle:HandlePoint, basic2:BasicPoint):[number,number]{
        let x = basic1.x + (basic2.x-basic1.x)*handle.xl;
        let y = basic1.y + (basic2.y-basic1.y)*handle.yl;
        return [x, y];
    }
    private setHandleAbsByRelPos(num:number){
        let [x, y] = this.calcHandleAbs(this.basics[num], this.handles[num], this.basics[num+1]);
        this.handles[num].x = x;
        this.handles[num].y = y;
    }
    getHandleDelta(point:HandlePoint){
        let num = this.handles.findIndex((e)=>(e==point));
        let x = this.basics[num].x + (this.basics[num+1].x-this.basics[num].x)*this.handles[num].xl - point.x;
        let y = this.basics[num].y + (this.basics[num+1].y-this.basics[num].y)*this.handles[num].yl - point.y;
        return [x,y];
    }
}

export class Point extends IdComponent{
    x:number;
    y:number;
    constructor(x:number,y:number,id:number){
        super(id, "p", null);
        this.x = x;
        this.y = y;
    }
    toJSON() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
        };
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