export default class CommandPattern{
    public commands:Command[] = [];
    public undoCommands:Command[] = [];
    public addCommand(command:Command){
        this.commands.push(command);
        this.undoCommands = [];
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
}

export class Command{
    do(){console.log("Do");}
    undo(){console.log("Undo");}
}

export class Complex extends Command{
    constructor(public commands:Command[]){
        super();
    }
    do(){
        console.log("Complex DO");
        for (let i=0; i<this.commands.length; i++)
            this.commands[i].do();
    }
    undo(){
        console.log("Complex UNDO");
        for (let i=this.commands.length-1; i>=0; i--)
            this.commands[i].undo();
    }
}

export class Create extends Command{
    constructor(public subject:any, public object:any){
        super();
        this.do();
    }
    do(){
        console.log("Create"+this.object);
        this.subject.create(this.object);
    }
    undo(){
        console.log("Delete"+this.object);
        this.subject.delete(this.object);
    }
}

export class Delete extends Command{
    constructor(public subject:any, public object:any){
        super();
        this.do();
    }
    do(){
        console.log("Delete"+this.object);
        return this.subject.delete(this.object);
    }
    undo(){
        console.log("Create"+this.object);
        this.subject.create(this.object);
    }
}

export class Move extends Command{
    constructor(public subject:any, public object:any, public offset:number[]){
        super();
        this.do();
    }
    do(){
        console.log("Move "+this.offset);
        this.subject.move(this.object, this.offset);
    }
    undo(){
        let un = []
        for (let i=0; i<this.offset.length; i++){
            un.push(-this.offset[i]);
        }
        console.log("Move "+this.offset);
        this.subject.move(this.object, un);
    }
}

export class Select extends Command {
    un:any;
    constructor(public subject:any, public object:any){
        super();
        this.un = this.do();
    }
    do(){
        console.log("Select");
        return this.subject.select(this.object);
    }
    undo(){
        console.log("Unselect");
        this.subject.unselect(this.un);
    }
}

export class Set extends Command{
    un:any;
    constructor(public subject:any, public object:any){
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