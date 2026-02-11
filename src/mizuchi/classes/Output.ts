import View from "../drawers/view";
import Node from "../nodes/node";
import Connector from "./connectors";
import IdComponent from "./id_component";

export default abstract class Output extends IdComponent {
    abstract cache:any
    connected: Connector[] = [];
    static getSeparator(){ return 'o';}
    constructor(public name:string, public x:number, public y:number, parent:Node) {
        super(0, Output.getSeparator(), parent);
    }
    abstract get():any
    hitScan(x:number, y:number, r:number):boolean {
        return Math.abs(this.x-x) < r && Math.abs(this.y-y) < r;
    }
    render(view:View){
        view.drawPin(this.x, this.y, 4, 1, view.color.back, view.getColor(this));
    }
}

export class OutputSignal extends Output{
    cache:number = 0
    constructor(name:string, x:number, y:number, parent:Node) {
        super(name, x, y, parent);
    }
    returnJSON() {
        return { };
    }
    findByFullID(fullID: string) {
        if (fullID.length==0) return this;
        return null;
    }
    get():number{
        this.parent.compute();
        return this.cache
    }
}

export class OutputBool extends Output {
    cache:boolean = false
    constructor(name:string, x:number, y:number, parent:Node) {
        super(name, x, y, parent);
    }
    returnJSON() {
        return { };
    }
    findByFullID(fullID: string) {
        if (fullID.length==0) return this;
        return null;
    }
    get():boolean{
        this.parent.compute();
        return this.cache
    }
}

export class OutputFloat extends Output {
    cache:number = 0
    constructor(name:string, x:number, y:number, parent:Node) {
        super(name, x, y, parent);
    }
    returnJSON() {
        return { };
    }
    findByFullID(fullID: string) {
        if (fullID.length==0) return this;
        return null;
    }
    get():number{
        this.parent.compute();
        return this.cache
    }
}