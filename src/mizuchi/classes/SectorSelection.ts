export default class  SectorSelection {
    x1:number = -1;
    y1:number = -1;
    x2:number = -1; 
    y2:number = -1;
    zero(){
        this.x1 = -1;
        this.y1 = -1;
        this.x2 = -1;
        this.y2 = -1;
    }
    setSS1(x:number, y:number){
        this.x1 = x;
        this.y1 = y;
    }
    setSS2(x:number, y:number){
        this.x2 = x;
        this.y2 = y;
    }
}