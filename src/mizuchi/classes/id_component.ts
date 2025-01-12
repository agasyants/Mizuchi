export default abstract class IdComponent {
    public id: number;
    public separator: string;
    public parent:any|null = null;

    constructor(id:number, separator:string) {
        this.id = id;
        this.separator = separator;
    }
    getFullId():string {
        if (this.parent == null) 
            return this.separator + this.id.toString();
        return this.parent.getFullId() + this.separator + this.id.toString();
    }
}

export class IdArray<T> extends Array<T> {
    increment:number = 0;
    constructor() {
      super();
      this.increment = 0;
    }
    getNewId(){
        this.increment++;
        return this.increment-1;
    }
    clear(){
        this.length = 0;
    }
}