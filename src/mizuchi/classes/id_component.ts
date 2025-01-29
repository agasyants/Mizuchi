export default abstract class IdComponent {
    public id: number;
    public separator: string;

    constructor(id:number, separator:string, public parent:any|null) {
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
    toJSON(): { data: T[]; increment: number } {
        return {
            increment: this.increment,
            data: [...this],
        };
    }
    static fromJSON<T>(json: { data: T[]; increment: number }): IdArray<T> {
        const idArray = new IdArray<T>();
        idArray.push(...json.data);
        idArray.increment = json.increment;
        return idArray;
    }
    getNewId(){
        // console.log(this.increment);
        this.increment++;
        return this.increment-1;
    }
    clear(){
        this.length = 0;
    }
}