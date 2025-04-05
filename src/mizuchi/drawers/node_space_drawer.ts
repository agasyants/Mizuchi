import CommandPattern from "../classes/CommandPattern";
import { NodeSpace } from "../classes/node";
import Drawer from "./Drawer";
import View from "./view";

export default class NodeSpaceDrawer extends Drawer {
    tabs:NodeSpace[] = [];
    ctrl = false;
    drugged = false;
    view = new View(this.ctx);
    margin_top = 20;
    width = 0;
    height = 0;
    was:[x:number,y:number] = [0, 0];
    constructor(canvas:HTMLCanvasElement, public nodeSpace:NodeSpace, public commandPattern:CommandPattern){
        super(canvas);
        this.setCanvasSize(canvas.width, canvas.height);
        this.initialize();
        this.render();
    }
    initialize() {
        this.canvas.onselectstart = function () { return false; }
        this.canvas.tabIndex = 2;
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY)
                this.view.zoom(e.deltaY/100, this.was);
            this.render();
        });
        this.canvas.addEventListener('keyup', (e) => {
            if (e.code=="ControlLeft"){
                this.ctrl = false;
                this.render()
            }
        });
        this.canvas.addEventListener("keydown", (e) => {
            e.preventDefault();
            if (e.code=="ControlLeft"){
                this.ctrl = true;
                this.render()
            }
            if (e.code!="KeyS" && e.code!="KeyI" && e.code!="Space"){
                e.stopPropagation();
            }
            if (e.code=="KeyC" && e.ctrlKey){
                // this.copy();
            }
            if (e.code=="KeyV" && e.ctrlKey){
                // this.paste();
                // this.update_mix();
            }
            if (e.code=="KeyZ" && e.ctrlKey){
                if (e.shiftKey)
                    this.commandPattern.redo();
                else 
                this.commandPattern.undo();
                // this.update_mix();
            }
            if (e.code=="KeyA" && e.ctrlKey){
                // this.selectAll();
            }
            if (e.code=="Delete" || e.code=="Backspace"){
                // this.delete();
                // this.update_mix();
            } 
            if (e.code=="KeyX" && e.ctrlKey){
                // this.cut();
                // this.update_mix();
            }
            if (e.code=="KeyD" && e.ctrlKey){
                // this.dublicate();
                // this.update_mix();
            }
            this.render();
        });
        this.canvas.addEventListener('pointermove', (e) => {
            const [x,y] = this.rectInput(e);
            this.was = [x/this.width, y/this.height];
            if (this.drugged) {
                this.view.calcCenter(x,y);
                this.render();
            }
            // this.controller.hitScan(x, y, 0.2, e.ctrlKey, e.altKey);
        });
        this.canvas.addEventListener('pointerdown', (e) => {
            if (e.button == 0) {
                this.canvas.setPointerCapture(e.pointerId);
                this.drugged = true;
                const [x,y] = this.rectInput(e);
                this.view.calcDown(x,y);
                this.render();
            }
        });
        this.canvas.addEventListener('pointerup', (e) => {
            if (e.button == 0) {
                this.drugged = false;
                this.render();
            }
        });
    }
    rectInput(e:MouseEvent){
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left);
        const y = (e.clientY - rect.top);
        return [x,y];
    }
    setCanvasSize(width: number, height: number): void {
        // this.ctx.translate(0, -this.h)
        super.setCanvasSize(width, height)
        // this.ctx.translate(0, this.h)
        this.ctx.scale(1,-1)
        this.width = this.w;
        this.height = (this.h - this.margin_top);
        this.view.setSize(this.width, this.height);
        this.render();
    }
    render(){
        // this.duration = Math.min(this.score.duration, this.score.loop_duration)
        requestAnimationFrame(()=>{this._render()})
    }
    private _render() {
        // console.log(this.was)
        this.ctx.clearRect(0, 0, this.w, -this.h);
        // console.log(this.nodeSpace.nodes);
        // console.log(this.nodeSpace.nodes);
        for (let con of this.nodeSpace.connectors) {
            con.render(this.view);
        }
        for (let node of this.nodeSpace.nodes) {
            node.render(this.view);
        }
        this.nodeSpace.outputNode.render(this.view);
    }
}
