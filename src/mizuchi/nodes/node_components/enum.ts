import View from "../../drawers/view";
import Node from "../node";
import NodeComponent from "./node_component";

export default class ListComponent extends NodeComponent {
    isMoveble: boolean = false;
    isOpened: boolean = false;
    hovered: number = -1;
    constructor(node:Node, x:number, y:number, w:number, h:number, public variants:string[], public pos:number){
        super(node, x, y, w/node.width, h/node.height)
    }
    render(view:View){
        let color = view.getColor(this);
        this.correct_abs()
        let rx = this.abs.x
        let ry = this.abs.y
        if (this.isOpened) {
            view.drawFrame(rx, ry, this.abs.w, this.abs.h, 1, color, 'black')
            view.drawText(rx, ry, 70, 30, this.variants[this.pos], 'white')
            for (let i = 0; i < this.variants.length-1; i++) {
                const y = ry + (i+1)*this.abs.h
                view.drawFrame(rx, y, this.abs.w, this.abs.h, 1, color, 'black')
                view.drawText(rx, y, 70, 30, this.variants[i+1], 'white')
            }
            if (this.hovered >= 0) {
                const y = ry + (this.hovered)*this.abs.h
                view.drawFrame(rx, y, this.abs.w, this.abs.h, 1, 'yellow', 'black')
                view.drawText(rx, y, 70, 30, this.variants[this.hovered], 'yellow')
            }

        } else {
            view.drawFrame(rx, ry, this.abs.w, this.abs.h, 1, color, 'black')
            view.drawText(rx, ry, 70, 30, this.variants[this.pos], 'white')
        }
    }
    hitScan(x:number, y:number, r:number):boolean {
        if (this.isOpened) {
            if (this.rel.x < x+r && x-r < this.rel.x + this.rel.w && this.rel.y - this.rel.h * (this.variants.length) < y+r && y-r < this.rel.y + this.rel.h) {
                for (let i = 0; i < this.variants.length; i++) {
                    if (this.rel.x < x+r && x-r < this.rel.x + this.rel.w && this.rel.y - this.rel.h*i < y+r && y-r < this.rel.y + this.rel.h - this.rel.h*i) {
                        this.hovered = i
                        break
                    }
                }
                return true
            } else {
                return false
            }
        } else {
            if (this.rel.x < x+r && x-r < this.rel.x + this.rel.w && this.rel.y < y+r && y-r < this.rel.y + this.rel.h) {
                return true
            } else {
                return false
            }
        }
    }
    click(): void {
        if (this.isOpened) {
            this.pos = this.hovered
        }
        this.isOpened = !this.isOpened
    }
    move(): void {
        console.error("error")
    }
}