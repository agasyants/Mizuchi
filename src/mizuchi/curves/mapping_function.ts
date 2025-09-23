import Node from "../nodes/node";
import Function from "./function";
import { BasicPoint, HandlePoint } from "./points";

export default class Mapping extends Function {
    constructor(parent: any, xm:number,xM:number,ym:number,yM:number, id:number, basics:BasicPoint[]=[new BasicPoint(null,0,0,0), new BasicPoint(null,0.25,1,1), new BasicPoint(null, 0.75,-1,2), new BasicPoint(null,1,0,3)], handles:HandlePoint[]=[new HandlePoint(null,0.125,0.5,0), new HandlePoint(null,0.5,0,1), new HandlePoint(null,0.875,-0.5,2)]){
        super(xm, xM, ym, yM, basics, handles, id, parent);
        for (let bp of this.basics) {
            bp.parent = this
        }
        for (let hp of this.basics) {
            hp.parent = this
        }
    }
    returnJSON() {
        return {
            ...super.returnJSON(),
        };
    }
    static fromJSON(json: any, parent: Node | null): Mapping {
        console.log('!!!REWRITE!!!');
        const basics = json.basics.data.map((basicJson: any) => BasicPoint.fromJSON(basicJson));
        const handles = json.handles.data.map((handleJson: any) => HandlePoint.fromJSON(handleJson));
        const func = new Mapping(
            parent,
            json.x_min,
            json.x_max,
            json.y_min,
            json.y_max,
            json.id,
            basics,
            handles
        );
        for (let b of basics) {
            b.parent = func
        }
        for (let h of handles) {
            h.parent = func
        }
        return func;
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