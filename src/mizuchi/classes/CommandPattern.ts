export default class CommandPattern{
    private commands:Command[] = [];
    private undoCommands:Command[] = [];
    private recording:boolean = false;
    private recordingBuffer:Command[] = [];
    addCommand(command:Command){
        if (this.recording) {
            this.recordingBuffer.push(command);
        } else {
            this.commands.push(command);
            this.undoCommands = [];
        }
        // save
    }
    undo(){
        const command = this.commands.pop();
        if (command){
            this.undoCommands.push(command);
            command.undo();
        }
    }
    redo(){
        const command = this.undoCommands.pop();
        if (command){
            this.commands.push(command);
            command.do();
        }
    }
    recordOpen(){
        this.recording = true;
    }
    recordClose(){
        this.recording = false;
        this.addCommand(new Complex(this.recordingBuffer));
        // console.log(this.recordingBuffer);
        this.recordingBuffer = [];
    }
    toJSON() {
        return {
            commands: this.commands,
            undoCommands: this.undoCommands,
        };
    }
    fromJSON(json: any) {
        this.commands = json.commands.map((cmd: any) => Command.fromJSON(cmd));
        this.undoCommands = json.undoCommands.map((cmd: any) => Command.fromJSON(cmd));
        this.recording = json.recording;
        this.recordingBuffer = json.recordingBuffer.map((cmd: any) => Command.fromJSON(cmd));
    }
}

export class Command {
    constructor(){}
    do(){
        console.log("Do");
    }
    undo(){
        console.log("Undo");
    }
    toJSON() {
        return {
            type: this.constructor.name
        };
    }

    static fromJSON(json: any): Command {
        switch (json.type) {
            case 'Complex': return Complex.fromJSON(json);
            case 'Create': return Create.fromJSON(json);
            case 'Delete': return Delete.fromJSON(json);
            case 'Move': return Move.fromJSON(json);
            case 'Set': return Set.fromJSON(json);
            default: return new Command();
        }
    }
}

export class Complex extends Command{
    constructor(private commands:Command[]){
        // console.log("Complex");
        super();
    }
    do(){
        // console.log("Complex DO");
        for (let i=0; i<this.commands.length; i++)
            this.commands[i].do();
    }
    undo(){
        // console.log("Complex UNDO");
        for (let i=this.commands.length-1; i>=0; i--)
            this.commands[i].undo();
    }
    toJSON() {
        return {
            ...super.toJSON(),
            commands: this.commands
        };
    }
    static fromJSON(json: any): Complex {
        return new Complex(
            json.commands.map((cmd: any) => Command.fromJSON(cmd))
        );
    }
}

export class SimpleCommand extends Command {
    constructor(public subject:any, public objects:any[]){
        super();
    }
    toJSON() {
        return {
            ...super.toJSON(),
            subject: this.subject.getFullId(),
            objects: this.objects.map((obj: any) => obj.getFullId())
        };
    }
}

export class Create extends SimpleCommand {
    private places:number[];
    constructor(subject:any, objects:any[], places:number[] = []){
        super(subject, objects);
        this.places = places;
        this.places = this.do();
    }
    do(){
        console.log("Create "+ this.objects);
        return this.subject.create(this.objects, this.places);
    }
    undo(){
        console.log("Delete "+ this.objects);
        this.subject.delete(this.objects);
    }
    toJSON() {
        // console.log(this.subject, this.object)
        return {
            ...super.toJSON(),
            places: this.places
        };
    }
    static fromJSON(json: any): Create {
        return new Create(json.subject, json.object, json.places);
    }
}

export class Delete extends SimpleCommand{
    places:number[];
    constructor(subject:any, objects:any[]){
        super(subject, objects);
        this.places = this.do();
    }
    do(){
        console.log("Delete"+this.objects);
        return this.subject.delete(this.objects);
    }
    undo(){
        console.log("Create"+this.objects);
        this.subject.create(this.objects, this.places);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            place: this.places
        };
    }
    static fromJSON(json: any): Delete {
        const cmd = new Delete(json.subject, json.object);
        cmd.places = json.places;
        return cmd;
    }
}

export class Move extends SimpleCommand{
    constructor(subject:any, objects:any[], private offset:number[]){
        super(subject, objects);
        this.do();
    }
    do(){
        console.log("Move "+ this.offset);
        this.subject.move(this.objects, this.offset, false);
    }
    undo(){
        console.log("unMove "+ this.offset);
        this.subject.move(this.objects, this.offset, true);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            offset: this.offset
        };
    }
    static fromJSON(json: any): Move {
        return new Move(json.subject, json.object, json.offset);
    }
}

export class Set extends Command{
    un:any;
    constructor(private subject:any, private object:any){
        super();
        this.un = this.do();
    }
    do(){
        console.log("Set");
        return this.subject.set(this.object);
    }
    undo(){
        console.log("unSet");
        this.subject.set(this.un);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            subject: this.subject.getFullId(),
            object: this.object.getFullId(),
            un: this.un
        };
    }
    static fromJSON(json: any): Set {
        const cmd = new Set(json.subject, json.object);
        cmd.un = json.un;
        return cmd;
    }
}