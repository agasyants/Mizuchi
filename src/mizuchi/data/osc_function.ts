export default class OscFunction{
    basics: BasicPoint[] = [];
    handles: HandlePoint[] = [];
    constructor(basics:BasicPoint[]=[new BasicPoint(0, 0, false, false), new BasicPoint(1, 0, false, false)], handles:HandlePoint[] = [new HandlePoint(0.5,0)]){
        this.set(basics,handles);
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
    set(basics:BasicPoint[], handles:HandlePoint[]){
        let result = [this.basics,this.handles]
        this.basics = [];
        this.handles = [];
        for (let basic of basics){
            this.basics.push(basic.clone())
        }
        for (let handle of handles){
            this.handles.push(handle.clone())
        }
        return result;
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
            return [new BasicPoint(0, 0, false, false), new HandlePoint(0, 0), new HandlePoint(0, 0)];
        }
    }
    create(points:any){
        let basic = points[0];
        let handle1 = new HandlePoint(0, 0);
        let handle2 = new HandlePoint(0, 0);
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
            this.basics = [];
            this.handles = [];
            return;
        }
        let point = points[0];
        const num = this.basics.indexOf(point);
        this.basics.splice(num, 1);
        this.handles.splice(num-1, 2, new HandlePoint(0,0));
        this.setHandleAbsByRelPos(num-1);
    }
    getSample(i:number, basics:BasicPoint[]=this.basics, handles:HandlePoint[]=this.handles):number{
        for (let j = 0; j < basics.length-1; j++){
            if (basics[j+1].x == i){
                return basics[j+1].y;
            }
            if (basics[j].x <= i && i <= basics[j+1].x){
                let p0 = basics[j];
                let p1 = handles[j];
                let p2 = basics[j+1];
                let A = p0.x - 2*p1.x + p2.x;
                let B = 2*(p1.x-p0.x);
                let C = p0.x-i;
                let t = 0;
                if (A == 0 || (p1.xl==0.5 && p1.yl==0.5)) {
                    t = (i-p0.x)/(p2.x-p0.x);
                } else {
                    let D = B*B - 4*A*C;
                    let sqrtDiscriminant = Math.sqrt(D);
                    let t1 = (-B + sqrtDiscriminant) / (2 * A);
                    let t2 = (-B - sqrtDiscriminant) / (2 * A);
                    let tValues = [t1, t2].filter(t => t >= 0 && t <= 1);
                    t = tValues[0];
                }
                return Math.pow(1-t,2)*p0.y + 2*t*p1.y*(1-t) + t*t*p2.y;
            }
        }
        return -1;
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

export class Point{
    x:number;
    y:number;
    constructor(x:number, y:number){
        this.x = x;
        this.y = y;
    }
    getLength(x:number, y:number):number{
        return Math.sqrt(Math.pow(this.x-x, 2) + Math.pow(this.y-y, 2));
    }
    clone():Point{
        return new Point(this.x, this.y);
    }
}

export class BasicPoint extends Point{
    x_move:boolean;
    y_move:boolean;
    constructor(x:number, y:number, x_move:boolean=true, y_move:boolean=true){
        super(x, y);
        this.x_move = x_move;
        this.y_move = y_move;
    }
    clone():BasicPoint{
        return new BasicPoint(this.x, this.y, this.x_move, this.y_move);
    }
}

export class HandlePoint extends Point{
    xl:number;
    yl:number;
    constructor(x:number, y:number, xl:number = 0.5, yl:number = 0.5){
        super(x, y);
        this.xl = xl;
        this.yl = yl;
    }
    clone():HandlePoint{
        return new HandlePoint(this.x, this.y, this.xl, this.yl);
    }
}