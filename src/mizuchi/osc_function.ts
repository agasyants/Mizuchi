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
            this.handles[num-1].x=this.calcRatio(this.basics[num-1].x,this.handles[num-1].x,this.basics[num].x,x);
            this.handles[num].x=this.calcRatio(this.basics[num+1].x,this.handles[num].x,this.basics[num].x,x);
            point.x = x;
            if (y < -1){
                y = -1;
            } else if (y > 1){
                y = 1;
            } 
            this.handles[num-1].y=this.calcRatio(this.basics[num-1].y,this.handles[num-1].y,this.basics[num].y,y);
            this.handles[num].y=this.calcRatio(this.basics[num+1].y,this.handles[num].y,this.basics[num].y,y);
            point.y = y;
        } else {
            const num = this.handles.findIndex((e)=>(e == point));
            let max_x = this.basics[num+1].x;
            let min_x = this.basics[num].x;
            if (x > max_x){
                this.handles[num].x = max_x;
            } else if (x < min_x){
                this.handles[num].x = min_x;
            } else {
                this.handles[num].x = x;
            }
            let max_y = Math.max(this.basics[num].y,this.basics[num+1].y);
            let min_y = Math.min(this.basics[num].y, this.basics[num+1].y);
            if (y > max_y){
                this.handles[num].y = max_y;
            } else if (y < min_y){
                this.handles[num].y = min_y;
            } else {
                this.handles[num].y = y;
            }
        }
    }
    calcRatio(a1:number, a2:number, a_old:number, a_new:number):number{
        if (a_old==a1){
            return a2;
        } return a1 + (a_new-a1)*(a2-a1)/(a_old-a1);
    }
    setDefaultHandle(num:number){
        this.handles[num].x=(this.basics[num].x+this.basics[num+1].x)*0.5;
        this.handles[num].y=(this.basics[num].y+this.basics[num+1].y)*0.5;
    }
    addBasicPoint(point:Point, num:number){
        this.basics.splice(num, 0, point);
        this.handles.splice(num-1, 1, new Point(0,0), new Point(0,0));
        this.setDefaultHandle(num-1);
        this.setDefaultHandle(num);
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
                if (A == 0) return p0.y+(p2.y-p0.y)*(i-p0.x)/(p2.x-p0.x);
                let D = B*B - 4*A*C;
                let sqrtDiscriminant = Math.sqrt(D);
                let t1 = (-B + sqrtDiscriminant) / (2 * A);
                let t2 = (-B - sqrtDiscriminant) / (2 * A);
                let tValues = [t1, t2].filter(t => t >= 0 && t <= 1);
                let t = tValues[0];
                return Math.pow(1-t,2)*p0.y + 2*t*p1.y*(1-t) + t*t*p2.y;
            }
        }
        return 0;
    }
    getItest(i:number):number{
        return (Math.acos(Math.cos(i * Math.PI*2)) - (Math.PI / 2)) / (Math.PI / 2) * 2 - 1;
    }
}

export class Point{
    x:number;
    y:number;
    constructor(x:number, y:number){
        this.x = x;
        this.y = y;
    }
}