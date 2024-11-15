export default class CommandPattern{
    public commands:Command[] = [];
    public undoCommands:Command[] = [];
    public addCommand(command:Command){
        this.commands.push(command);
        this.undoCommands = [];
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


export class Create extends Command{
    constructor(public subject:any, public object:any, shouldUse:boolean=true){
        super();
        if (shouldUse) this.do();
    }
    do(){
        console.log("Create");
        this.subject.create(this.object);
    }
    undo(){
        console.log("Delete");
        this.subject.delete(this.object);
    }
}

export class Delete extends Command{
    constructor(public subject:any, public object:any, shouldUse:boolean=true){
        super();
        if (shouldUse) this.do();
    }
    do(){
        console.log("Delete");
        this.subject.delete(this.object);
    }
    undo(){
        console.log("Create");
        this.subject.create(this.object);
    }
}

export class Move extends Command{
    constructor(public subject:any, public object:any, public x:number, public y:number, shouldUse:boolean=true){
        super();
        if (shouldUse) this.do();
    }
    do(){
        console.log("Move "+this.x+" "+this.y);
        this.subject.move(this.object, this.x, this.y);
    }
    undo(){
        console.log("Move "+(-this.x)+" "+(-this.y));
        this.subject.move(this.object, -this.x, -this.y);
    }
}

export class Paste extends Command{
    constructor(public subject:any, public object:any, shouldUse:boolean=true){
        super();
        if (shouldUse) this.do();
    }
    do(){
        console.log("Paste");
        this.subject.paste(this.object);
    }
    undo(){
        console.log("Delete");
        this.subject.delete(this.object);
    }
}