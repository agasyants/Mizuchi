import IdComponent from "./id_component";
import Input from "./Input";
import { NodeSpace } from "./node";
import Output from "./Output";

export default class Connector extends IdComponent{
    input:Output|null = null;
    output:Input|null = null;
    constructor(id:number,parent:NodeSpace,input:Output|null=null,output:Input|null=null){
        super(id,'c',parent);
        this.input = input;
        this.output = output;
    }
    toJSON() {
        let inp;
        if (this.input == null) inp = null;
        else inp = this.input.getFullId();
        let out;
        if (this.output == null) out = null;
        else out = this.output.getFullId();
        return {
            input: inp,
            output: out
        };
    }
    static fromJSON(json: any, parent: NodeSpace): Connector {
        const input = parent.findOutputById(json.input);
        const output = parent.findInputById(json.output);
        const connector = new Connector(json.id, parent, input, output);
        if (input) {
            input.connected = connector;
        }
        if (output) {
            output.connected = connector;
        }
        return connector;
    }
    changeInput(new_input:Output){
        if (this.input != null) this.input.connected = null;
        this.input = new_input;
        new_input.connected = this;
    }
    changeOutput(new_output:Input){
        if (this.output != null) this.output.connected = null;
        this.output = new_output;
        new_output.connected = this;
    }
    get(){
        return this.input?.get() || 0;
    }
}