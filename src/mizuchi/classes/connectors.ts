import Curve from "../curves/curve";
import { BasicPoint, HandlePoint } from "../curves/points";
import View from "../drawers/view";
import NodeSpace from "../nodes/node_space";
import IdComponent from "./id_component";
import Input from "./Input";
import Output from "./Output";

export default class Connector extends IdComponent{
    input:Output|null = null;
    output:Input|null = null;
    curve:Curve = new Curve([], [], 0, this)
    static getSeparator(){ return 'c'; }
    constructor(id:number, parent:NodeSpace, input:Output|null=null, output:Input|null=null){
        super(id, Connector.getSeparator(), parent);
        this.input = input;
        if (input) {
            this.curve.basics.push(new BasicPoint(this, input.x, input.y, 0))
        } else {
            this.curve.basics.push(new BasicPoint(this, 0,0,0))
        }
        this.output = output;
        if (output) {
            this.curve.basics.push(new BasicPoint(this, output.x, output.y, 1))
        } else {
            this.curve.basics.push(new BasicPoint(this, 0, 0, 1))
        }
        this.curve.handles.push(new HandlePoint(this, 0, 0, 2));
        this.curve.setHandleAbsByRelPos(0)
    }
    returnJSON() {
        let inp;
        if (this.input == null) inp = null;
        else inp = this.input.getFullId();
        let out;
        if (this.output == null) out = null;
        else out = this.output.getFullId();
        return {
            sep: Connector.getSeparator(),
            id: this.id,
            input: inp,
            output: out
        };
    }
    findByFullID(fullID:string) {
        if (fullID.length==0) return this;
        console.error('con', fullID);
        return null;
    }
    static fromJSON(json: any, parent: NodeSpace): Connector {
        const input = parent.findOutputById(json.input);
        const output = parent.findInputById(json.output);
        // console.log("input, output", input, output);
        const connector = new Connector(json.id, parent, input, output);
        if (input) {
            input.connected.push(connector);
        }
        if (output) {
            output.connected = connector;
        }
        return connector;
    }
    changeInput(new_input:Output){
        if (this.input != null) this.input.connected = [];
        this.input = new_input;
        new_input.connected.push(this);
    }
    changeOutput(new_output:Input){
        if (this.output != null) this.output.connected = null;
        this.output = new_output;
        new_output.connected = this;
    }
    get(){
        // console.log('sum');
        return this.input?.get() || 0;
    }
    render(view:View){
        const color = view.getColor(this);
        view.drawCurve(this.curve, color);
        for (let basic of this.curve.basics){
            view.drawCircle(basic.x, basic.y, 4, color);
        }
        if (color === view.color.hovered){
            for (let handle of this.curve.handles){
                view.drawCircle(handle.x, handle.y, 4, color);
            }
        }
    }
    hitScan(xx:number, yy:number, threshold:number): any {
        const steps = 10;
        const p0 = this.curve.basics[0];
        const p1 = this.curve.handles[0];
        const p2 = this.curve.basics[1];
    
        let prev = { x: p0.x, y: p0.y };
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const x = (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x;
            const y = (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y;
            const curr = { x, y };
    
            const dx = xx - prev.x;
            const dy = yy - prev.y;
            const lengthSquared = (curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2;
            if (lengthSquared === 0) continue;
    
            const tLine = Math.max(0, Math.min(1, ((dx * (curr.x - prev.x)) + (dy * (curr.y - prev.y))) / lengthSquared));
            const closestX = prev.x + tLine * (curr.x - prev.x);
            const closestY = prev.y + tLine * (curr.y - prev.y);
            const distX = xx - closestX;
            const distY = yy - closestY;
            const dist = Math.sqrt(distX * distX + distY * distY);
    
            if (dist < threshold) return this;
    
            prev = curr;
        }
    
        return null;
    }    
}