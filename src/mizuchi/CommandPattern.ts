export default class CommandPattern{
    private static _instance:CommandPattern;
    public static get_instance():CommandPattern{
        if (!this._instance) this._instance = new CommandPattern();
        return this._instance;
    }
    constructor(){
        console.log("CommandPattern created");
    }
}


export class Command{
    constructor(){
        console.log("Command created");
    }
}

export class Cut extends Command{
    constructor(public object:any, public subject:any, shouldUse:boolean){
        super();
        if (shouldUse) this.use();
    }
    use(){
        console.log("Cut");
        this.subject.cut(this.object);
    }
    getUndo(){
        return new Paste(this.object, this.subject, false);
    }
}

export class Paste extends Command{
    constructor(public object:any, public subject:any, shouldUse:boolean){
        super();
        if (shouldUse) this.use();
    }
    use(){
        console.log("Paste");
    }
    getUndo(){
        return new Cut(this.object, this.subject, false);
    }
}

export class Delete extends Command{
    constructor(public object:any, public subject:any, shouldUse:boolean){
        super();
        if (shouldUse) this.use();
    }
    use(){
        console.log("Delete");
        this.subject.delete(this.object);
    }
    getUndo(){
        return new Cut(this.object, this.subject, false);
    }
}

export class Move extends Command{
    constructor(public object:any, public subject:any, public x:number, public y:number, shouldUse:boolean=true){
        super();
        if (shouldUse) this.use();
    }
    use(){
        console.log("Move");
        this.subject.move(this.object, this.x, this.y);
    }
    getUndo(){
        return new Move(this.object, this.subject, -this.x, -this.y, false);
    }
}
