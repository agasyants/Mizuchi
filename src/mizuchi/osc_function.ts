export default class OscFunction{
    basics: Point[];
    handles: Point[];
    constructor(){
        this.basics = [new Point(0, 0), new Point(1, 0)];
        this.handles = [new Point(0,0)];
        this.setDefaultHandle(0);
    }
    move(point:Point, x:number, y:number):void{
        if (this.basics.includes(point)){
            const num = this.basics.indexOf(point);
            if (x < this.basics[num-1].x){
                x = this.basics[num-1].x;
            } else if (x > this.basics[num+1].x){
                x = this.basics[num+1].x;
            }
            point.x = x;
            if (y < -1){
                y = -1;
            } else if (y > 1){
                y = 1;
            } 
            point.y = y;
            this.setHandleAbsByRelPos(num);
            this.setHandleAbsByRelPos(num-1);
        } else {
            const num = this.handles.findIndex((e)=>(e == point));
            let max_x = this.basics[num+1].x;
            let min_x = this.basics[num].x;
            if (x > max_x){
                x = max_x;
            } else if (x < min_x){
                x = min_x;
            }
            let max_y = Math.max(this.basics[num].y,this.basics[num+1].y);
            let min_y = Math.min(this.basics[num].y, this.basics[num+1].y);
            if (y > max_y){
                y = max_y;
            } else if (y < min_y){
                y = min_y;
            }
            this.setHandleAbsPos(num,x,y);
        }
    }
    setDefaultHandle(num:number){
        this.handles[num].xl=0.5;
        this.handles[num].yl=0.5;
        this.setHandleAbsByRelPos(num);
    }
    addBasicPoint(x:number, y:number){
        for (let i = 0; i < this.basics.length-1; i++){
            if (this.basics[i].x <= x && x <= this.basics[i+1].x){
                this.basics.splice(i+1, 0, new Point(x, y));
                this.handles.splice(i, 1, new Point(0,0), new Point(0,0));
                this.setDefaultHandle(i);
                this.setDefaultHandle(i+1);
                return;
            }
        }
        
    }
    removeBasicPoint(point:Point){
        const num = this.basics.indexOf(point);
        this.basics.splice(num, 1);
        this.handles.splice(num-1, 2, new Point(0,0));
        this.setDefaultHandle(num-1);
    }
    getI(i:number):number{
        for (let j = 0; j < this.basics.length-1; j++){
            if (this.basics[j+1].x == i){
                return this.basics[j+1].y;
            }
            if (this.basics[j].x <= i && i <= this.basics[j+1].x){
                let p0 = this.basics[j];
                let p1 = this.handles[j];
                let p2 = this.basics[j+1];
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
        this.handles[num].x = x;
        this.handles[num].y = y;
        if (x-this.basics[num].x==0){
            this.handles[num].xl = 0;
        } else {
            this.handles[num].xl = (x-this.basics[num].x)/(this.basics[num+1].x-this.basics[num].x);
        }
        if (y-this.basics[num].y==0){
            this.handles[num].yl = 0;
        } else {
            this.handles[num].yl = (y-this.basics[num].y)/(this.basics[num+1].y-this.basics[num].y);
        }
    }
    setHandleAbsByRelPos(num:number){
        this.handles[num].x = this.basics[num].x + (this.basics[num+1].x-this.basics[num].x)*this.handles[num].xl;
        this.handles[num].y = this.basics[num].y + (this.basics[num+1].y-this.basics[num].y)*this.handles[num].yl;
    }
}

export class Point{
    x:number;
    y:number;
    xl:number;
    yl:number;
    constructor(x:number, y:number, xl:number = 0.5, yl:number = 0.5){
        this.x = x;
        this.y = y;
        this.xl = xl;
        this.yl = yl;
    }
}