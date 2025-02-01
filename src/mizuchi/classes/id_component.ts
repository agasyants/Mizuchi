export default abstract class IdComponent {
    public id: number;
    constructor(id:number, public separator:string, public parent:any|null) {
        this.id = id;
    }
    getFullId():string {
        if (this.parent == null) 
            return this.toJSON();
        return this.parent.getFullId() + this.separator + this.id.toString();
    }
    abstract returnJSON():any;
    abstract findByFullID(fullID:string):any;
    static getSeparator():string {return 'null'};
    // static splitFullID(fullID:string, Class: typeof IdComponent):any[]{
    //     if (fullID.startsWith(Class.getSeparator())){
    //         fullID = fullID.slice(Class.getSeparator().length);
    //         const index = parseInt(fullID, 10)
    //         return [fullID, index];
    //     }
    //     return [fullID, -1];
    // }
    toJSON() {
        if (this.parent === null) {
            return this;
        } else { 
            return this.returnJSON();
        }
    }
    static findByID(array:IdComponent[], id:number):any{
        for (let i = 0; i < array.length; i++){
            if (array[i].id == id){
                return array[i];
            }
        } console.error('not found');
        return null;
    }
    findByID(array:IdComponent[], id:number):any{
        for (let i = 0; i < array.length; i++){
            if (array[i].id == id){
                return array[i];
            }
        } console.error('not found');
        return null;
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
    static fromJSON<T>(data: T[], increment: number): IdArray<T> {
        const idArray = new IdArray<T>();
        idArray.push(...data);
        idArray.increment = increment;
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