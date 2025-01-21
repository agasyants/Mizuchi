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
            recording: this.recording,
            recordingBuffer: this.recordingBuffer
        };
    }
    fromJSON(json: any) {
        this.commands = json.commands.map((cmd: any) => Command.fromJSON(cmd));
        this.undoCommands = json.undoCommands.map((cmd: any) => Command.fromJSON(cmd));
        this.recording = json.recording;
        this.recordingBuffer = json.recordingBuffer.map((cmd: any) => Command.fromJSON(cmd));
    }
}

export class Command{
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

export class Create extends Command {
    constructor(private subject:any, private object:any, private place:number=-1){
        super();
        this.do();
    }
    do(){
        console.log("Create "+ this.object);
        this.subject.create(this.object, this.place);
    }
    undo(){
        console.log("Delete "+ this.object);
        this.subject.delete(this.object);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            subject: this.subject,
            object: this.object,
            place: this.place
        };
    }

    static fromJSON(json: any): Create {
        return new Create(json.subject, json.object, json.place);
    }
}

export class Delete extends Command{
    place:number;
    constructor(private subject:any, private object:any){
        super();
        this.place = this.do();
    }
    do(){
        console.log("Delete"+this.object);
        return this.subject.delete(this.object);
    }
    undo(){
        console.log("Create"+this.object);
        this.subject.create(this.object, this.place);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            subject: this.subject,
            object: this.object,
            place: this.place
        };
    }
    static fromJSON(json: any): Delete {
        const cmd = new Delete(json.subject, json.object);
        cmd.place = json.place;
        return cmd;
    }
}

export class Move extends Command{
    constructor(private subject:any, private object:any, private offset:number[]){
        super();
        this.do();
    }
    do(){
        console.log("Move "+ this.offset);
        this.subject.move(this.object, this.offset, false);
    }
    undo(){
        console.log("unMove "+ this.offset);
        this.subject.move(this.object, this.offset, true);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            subject: this.subject,
            object: this.object,
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
            subject: this.subject,
            object: this.object,
            un: this.un
        };
    }
    static fromJSON(json: any): Set {
        const cmd = new Set(json.subject, json.object);
        cmd.un = json.un;
        return cmd;
    }
}