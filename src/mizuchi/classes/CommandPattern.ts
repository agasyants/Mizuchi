import Mix from "../data/mix";

export default class CommandPattern
{
    private commands:Command[] = [];
    private undoCommands:Command[] = [];
    private recording:boolean = false;
    private recordingBuffer:Command[] = [];

    addCommand(command:Command){
        if (this.recording) {
            command.do();
            this.recordingBuffer.push(command);
        } else {
            if (command instanceof Complex && command.commands.length==1){
                command = command.commands[0];
            }
            this.commands.push(command);
            command.do();
            this.undoCommands = [];
        }
        console.warn(command, this.commands)
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
        if (this.recordingBuffer.length){
            this.commands.push(new Complex(this.recordingBuffer));
            this.undoCommands = [];
            this.recordingBuffer = [];
        }
    }
    toJSON() {
        console.error(this.commands, this.undoCommands)
        return {
            COMMANDS: this.commands,
            undoCOMMANDS: this.undoCommands,
        };
    }
    static fromJSON(json:any, root:Mix):CommandPattern {
        const cp = new CommandPattern();
        cp.commands = this.unpackCommands(json.COMMANDS, root);
        cp.undoCommands = this.unpackCommands(json.undoCOMMANDS, root);
        return cp;
    }
    static unpackCommands(jsonCommands:any, root:Mix):Command[]{
        const commands = []
        if (jsonCommands) {
            for (let cmd of jsonCommands) {
                const command = Command.fromJSON(cmd, root);
                if (command)
                    commands.push(command);
                else
                    console.error("Command not found", cmd);
            }
        }
        return commands;
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
    static fromJSON(json:any, root:Mix): Command {
        switch (json.type) {
            case 'Complex': return Complex.fromJSON(json, root);
            case 'Create': return Create.fromJSON(json, root);
            case 'Delete': return Delete.fromJSON(json, root);
            case 'Move': return Move.fromJSON(json, root);
            // case 'Set': return Set.fromJSON(json, root);
            default: return new Command();
        }
    }
}

export class Complex extends Command{
    constructor(public commands:Command[]){
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
    static fromJSON(json: any, root:Mix): Complex {
        return new Complex(
            CommandPattern.unpackCommands(json.commands, root)
        );
    }
}

export class SimpleCommand extends Command {
    constructor(public subject:any, public object:any, public place:number){
        super();
    }
    toJSON() {
        return {
            ...super.toJSON(),
            subject: this.subject.getFullId(),
            object: this.object.getFullId()
        };
    }
}

export class Create extends SimpleCommand {
    constructor(subject:any, objects:any, place:number){
        super(subject, objects, place);
    }
    do(){
        console.log("Create "+ this.object, this.place);
        return this.subject.create(this.object, this.place);
    }
    undo(){
        console.log("Delete "+ this.object, this.place);
        this.subject.delete(this.object, this.place);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            place: this.place
        };
    }
    static fromJSON(json:any, root:Mix): Create {
        return new Create(root.findByFullID(json.subject), root.findByFullID(json.object), json.place);
    }
}

export class Delete extends SimpleCommand{
    constructor(subject:any, object:any, public place:number){
        super(subject, object, place);
    }
    do(){
        console.log("Delete"+this.object, this.place);
        this.subject.delete(this.object, this.place);
    }
    undo(){
        console.log("Create"+this.object, this.place);
        this.subject.create(this.object, this.place);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            place: this.place
        };
    }
    static fromJSON(json:any, root:Mix): Delete {
        // console.log('json', json);
        return new Delete(root.findByFullID(json.subject), root.findByFullID(json.object), json.place);
    }
}

export class Move extends Command{
    constructor(private subject:any, private object:any, private from:number[], private to:number[]){
        super();
    }
    do(){
        console.log("Move", this.from, this.to);
        this.subject.move(this.object, this.to);
    }
    undo(){
        console.log("unMove", this.to, this.from);
        this.subject.move(this.object, this.from);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            subject: this.subject.getFullId(),
            object: this.object.getFullId(),
            from: this.from,
            to: this.to
        };
    }
    static fromJSON(json:any, root:Mix): Move {
        return new Move(
            root.findByFullID(json.subject),
            root.findByFullID(json.object),
            json.from,
            json.to
        );
    }
}

// export class Set extends Command{
//     un:any;
//     constructor(private subject:any, private object:any){
//         super();
//         if (go) this.un = this.do();
//     }
//     do(){
//         console.log("Set");
//         return this.subject.set(this.object);
//     }
//     undo(){
//         console.log("unSet");
//         this.subject.set(this.un);
//     }
//     toJSON() {
//         return {
//             ...super.toJSON(),
//             subject: this.subject.getFullId(),
//             object: this.object.getFullId(),
//             un: this.un
//         };
//     }
//     static fromJSON(json:any, root:Mix): Set {
//         const cmd = new Set(root.findByFullID(json.subject), root.findByFullID(json.object));
//         cmd.un = json.un;
//         return cmd;
//     }
// }