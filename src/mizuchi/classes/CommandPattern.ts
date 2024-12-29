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
}

export class Command{
    do(){console.log("Do");}
    undo(){console.log("Undo");}
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
}

export class Create extends Command{
    constructor(private subject:any, private object:any, private place:number=-1){
        super();
        this.do();
    }
    do(){
        console.log("Create"+this.object);
        this.subject.create(this.object, this.place);
    }
    undo(){
        console.log("Delete"+this.object);
        this.subject.delete(this.object);
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
}

export class Select extends Command {
    constructor(private subject:any, private object:any, private start:number, private end:number){
        super();
        this.do();
    }
    do(){
        console.log("Select", this.object.length);
        this.subject.select(this.object, this.start, this.end);
    }
    undo(){
        console.log("Unselect", this.object.length);
        this.subject.select(this.object, this.start, this.end);
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
}