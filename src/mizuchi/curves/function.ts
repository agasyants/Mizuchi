import { IdArray } from "../classes/id_component";
import Node from "../nodes/node";
import Curve from "./curve";
import { BasicPoint, HandlePoint, Point } from "./points";

export default class Function extends Curve{
    basics = new IdArray<BasicPoint>();
    handles = new IdArray<HandlePoint>();
    x_min:number;
    x_max:number;
    y_min:number;
    y_max:number;
    constructor(x_min:number,x_max:number,y_min:number,y_max:number,basics:BasicPoint[], handles:HandlePoint[], id:number,parent:any){
        super(basics, handles, id, parent, "f");
        this.x_min = x_min;
        this.x_max = x_max;
        this.y_min = y_min;
        this.y_max = y_max;
    }
    returnJSON() {
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
    calcBasic(basic:BasicPoint, num:number, x:number, y:number){
        console.log(basic, num, x, y);
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
}