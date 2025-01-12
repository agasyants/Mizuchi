import Function, { BasicPoint, HandlePoint } from "./function";

export default class Mapping extends Function{
    constructor(xm:number,xM:number,ym:number,yM:number, id:number, basics:BasicPoint[]=[], handles:HandlePoint[]=[]){
        super(xm, xM, ym, yM, basics, handles, id);
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
}