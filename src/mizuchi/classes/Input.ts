import Connector from "./connectors";
import IdComponent from "./id_component";
import Node from "./node";

export default abstract class Input extends IdComponent {
    connected: Connector|null = null;
    static getSeparator(){ return 'i';}
    constructor(parent:Node, public name:string, id:number, public x:number, public y:number) {
        super(id, Input.getSeparator(), parent);
    }
    abstract get():any
}

export class InputSignal extends Input{
    connected: Connector|null = null;
    constructor(parent:Node, name:string, id:number, x:number, y:number) {
        super(parent, name, id, x, y);
    }
    returnJSON() {
        return { };
    }
    findByFullID(fullID: string) {
        if (fullID.length==0) return this;
        return null;
    }
    get():number{
        if (this.connected == null) return 0;
        return this.connected.get();
    }
}
