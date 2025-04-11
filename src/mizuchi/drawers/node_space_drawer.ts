import CommandPattern from "../classes/CommandPattern";
import hovered from "../classes/hovered";
import NodeSpace from "../nodes/node_space";
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
    hovered:hovered = new hovered();
    commandPattern = new CommandPattern();
    was:[x:number,y:number] = [0, 0];
    constructor(canvas:HTMLCanvasElement, public nodeSpace:NodeSpace){
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
                this.render();
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
            }
            this.hitScan(this.view.calcToX(x), this.view.calcToY(y), 10, e.ctrlKey, e.altKey);
            this.render();
            // console.log(this.view.calcX(this.view.calcToX(x)),x,this.view.calcY(this.view.calcToY(y)),y)
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
        this.ctx.clearRect(0, 0, this.w, -this.h);
        for (let con of this.nodeSpace.connectors) {
            con._render(this.view, 'white');
        }
        // console.log(this.nodeSpace.nodes);
        for (let node of this.nodeSpace.nodes) {
            node._render(this.view, 'white');
        }
        this.nodeSpace.outputNode._render(this.view, 'white');
        for (let s of this.hovered.elements) {
            s._render(this.view, 'yellow');
        }
    }
    hitScan(x:number, y:number, radius:number, ctrl:boolean, alt:boolean){
        ctrl = ctrl;
        alt = alt;
        this.hovered.elements = [];
        for (let con of this.nodeSpace.connectors){
            const h = con.hitScan(x, y, radius);
            if (h) this.hovered.elements = [h];
        }
        for (let node of this.nodeSpace.nodes){
            const scan = node.hitScan(x, y, radius);
            if (scan) this.hovered.elements = [scan];
        } 
        const scan = this.nodeSpace.outputNode.hitScan(x,y,radius);
        if (scan) this.hovered.elements = [scan];
    }
}