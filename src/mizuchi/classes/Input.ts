import View from "../drawers/view";
import Node from "../nodes/node";
import Connector from "./connectors";
import IdComponent from "./id_component";

export default abstract class Input extends IdComponent {
    connected: Connector|null = null;
    static getSeparator(){ return 'i';}
    constructor(public name:string, id:number, public x:number, public y:number, parent:Node) {
        super(id, Input.getSeparator(), parent);
    }
    abstract get():any
    hitScan(x:number, y:number, r:number):boolean {
        return Math.abs(this.x-x) < r && Math.abs(this.y-y) < r;
    }
    findByFullID(fullID: string) {
        if (fullID.length==0) return this;
        return null;
    }
    render(view:View){
        view.drawPin(this.x, this.y, 4, 1, view.color.back, view.getColor(this));
    }
}

export class InputSignal extends Input {
    constructor(name:string, id:number, x:number, y:number, parent:Node) {
        super(name, id, x, y, parent);
    }
    returnJSON() {
        return { };
    }
    get():number{
        if (this.connected == null) return 0;
        return this.connected.get();
    }
}

export class InputBool extends Input {
    constructor(name:string, id:number, x:number, y:number, parent:Node) {
        super(name, id, x, y, parent);
    }
    returnJSON() {
        return { };
    }
    get():boolean{
        if (this.connected == null) return false;
        return this.connected.get();
    }
}

export class InputFloat extends Input {
    constructor(name:string, id:number, x:number, y:number, parent:Node) {
        super(name, id, x, y, parent);
    }
    returnJSON() {
        return { };
    }
    get():number{
        if (this.connected == null) return 0;
        return this.connected.get();
    }
}

export class InputMultiFloat extends Input {
    constructor(name:string, id:number, x:number, y:number, parent:Node) {
        super(name, id, x, y, parent);
    }
    returnJSON() {
        return { };
    }
    get():Array<number>{
        if (this.connected == null) return [];
        return this.connected.get();
    }
}

export class InputMidi extends Input {
    constructor(name:string, id:number, x:number, y:number, parent:Node) {
        super(name, id, x, y, parent);
    }
    returnJSON() {
        return { };
    }
    get():number{
        if (this.connected == null) return 0;
        return this.connected.get();
    }
}