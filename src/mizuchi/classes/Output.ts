import Node from "./node";
import Connector from "./connectors";
import IdComponent from "./id_component";

export default abstract class Output extends IdComponent {
    connected: Connector|null = null;
    static getSeparator(){ return 'o';}
    constructor(parent:Node, public name:string, public x:number, public  y:number) {
        super(0, Output.getSeparator(), parent);
    }
    abstract get():any
}

export class OutputSignal extends Output{
    connected: Connector|null = null;
    constructor(parent:Node, name:string, x:number, y:number) {
        super(parent, name, x, y);
    }
    returnJSON() {
        return { };
    }
    findByFullID(fullID: string) {
        if (fullID.length==0) return this;
        return null;
    }
    get():number{
        return this.parent.get();
    }
}