import CommandPattern, { Move, Create, Delete } from "../classes/CommandPattern";
import Connector from "../classes/connectors";
import Input from "../classes/Input";
import ContextMenu from "../classes/menu";
import Output from "../classes/Output";
import DelayNode from "../nodes/delay_node";
import MixNode from "../nodes/mix_node";
import Node from "../nodes/node";
import NodeSpace from "../nodes/node_space";
import Drawer from "./Drawer";
import View from "./view";

class Star {
    x: number;
    y: number;
    radius: number;
    alpha: number;
    constructor(x:number, y:number, radius:number, alpha:number){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.alpha = alpha;
    }
}

export default class NodeSpaceDrawer extends Drawer {
    tabs:NodeSpace[] = [];
    ctrl = false;
    drugged = false;
    view = new View(this.ctx);
    margin_top = 20;
    width = 0;
    height = 0;
    commandPattern = new CommandPattern();
    was:[x:number,y:number] = [0, 0];
    
    stars: Star[] = [];
    starDensity = 0.001;
    starParallax = 0.5;
    creatingMenu:ContextMenu = new ContextMenu();

    constructor(canvas:HTMLCanvasElement, public nodeSpace:NodeSpace){
        super(canvas);
        this.setCanvasSize(canvas.width, canvas.height);
        this.initialize();
        this.generateStars(this.width, this.height);
        this.render();
        this.creatingMenu.addItem('Mix Node', ()=>{
            this.createNode(new MixNode(0, 0, 0), this.creatingMenu.clickX, this.creatingMenu.clickY);
            this.render();
        });
        this.creatingMenu.addItem('Delay Node', ()=>{
            this.createNode(new DelayNode(0, 0, 0), this.creatingMenu.clickX, this.creatingMenu.clickY);
            this.render();
        });
        this.creatingMenu.addItem('Mix Node', ()=>{
            this.createNode(new MixNode(0, 0, 0), this.creatingMenu.clickX, this.creatingMenu.clickY);
            this.render();
        });
        this.creatingMenu.addItem('Mix Node', ()=>{
            this.createNode(new MixNode(0, 0, 0), this.creatingMenu.clickX, this.creatingMenu.clickY);
            this.render();
        });
        this.creatingMenu.addItem('Mix Node', ()=>{
            this.createNode(new MixNode(0, 0, 0), this.creatingMenu.clickX, this.creatingMenu.clickY);
            this.render();
        });
    }
    createNode(node: Node, x: number, y: number) {
        node.moveTo(x, y);
        this.commandPattern.addCommand(new Create(this.nodeSpace, node, 0));
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
                this.delete();
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
                const e = this.view.selected.elements;
                if (e.length) {
                    if (e.length==1){
                        const sel = e[0];
                        if (sel instanceof Node) {
                            this.drugNode(x, y)
                        } else if (sel instanceof Input) {
                            console.log('input')
                        } else if (sel instanceof Output) {
                            console.log('output')
                        } else {
                            console.log('connector')
                        }
                    } else {
                        console.log('many');
                    }
                } else {
                    this.view.calcCenter(x,y);
                    // this.calcVisible();
                }
            }
            this.hitScan(this.view.calcToX(x), this.view.calcToY(y), 10, e.ctrlKey, e.altKey);
            this.render();
            // console.log(this.view.calcX(this.view.calcToX(x)),x,this.view.calcY(this.view.calcToY(y)),y)
        });
        this.canvas.addEventListener('pointerdown', (e) => {
            const [x,y] = this.rectInput(e);
            if (e.button == 0 && !e.shiftKey) {
                this.canvas.setPointerCapture(e.pointerId);
                this.view.selected.elements = this.view.hovered.elements;
                this.view.selected.drugged_x = x;
                this.view.selected.drugged_y = y;
                this.drugged = true;
                this.view.calcDown(x,y);
                this.render();
            } else if (!e.shiftKey) {
                this.creatingMenu.show(this.view.calcToX(x),this.view.calcToY(y), e.clientX, e.clientY);
                e.stopPropagation();
                e.preventDefault();
            }
        });
        this.canvas.addEventListener('pointerup', (e) => {
            if (e.button == 0) {
                this.drugged = false;
                if (this.view.selected.elements.length>0) {
                    if (this.view.selected.elements[0] instanceof Node) {
                        this.commandPattern.addCommand(new Move(this.nodeSpace, this.view.selected.elements, [this.view.selected.offset.start, this.view.selected.offset.pitch]));
                    } else if (this.view.selected.elements[0] instanceof Input) {
                        // this.commandPattern.addCommand(new Create(this.nodeSpace, this.view.selected.elements, this.view.selected.offset));
                    } else if (this.view.selected.elements[0] instanceof Output) {
                        if (this.view.hovered.elements[0] instanceof Input) {
                            const new_con = new Connector(0, this.nodeSpace, this.view.selected.elements[0], this.view.hovered.elements[0]);
                            this.commandPattern.addCommand(new Create(this.nodeSpace, new_con, 0));
                        }
                    } 
                    
                }
                this.view.selected.clear();
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
    delete(){
        for (let e of this.view.selected.elements) {
            if (e instanceof Node) {
                this.commandPattern.addCommand(new Delete(this.nodeSpace, e, this.nodeSpace.nodes.indexOf(e)));
            } else if (e instanceof Connector) {
                this.commandPattern.addCommand(new Delete(this.nodeSpace, e, this.nodeSpace.connectors.indexOf(e)));
            }
        }
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
    calcVisible(){
        
    }
    generateStars(width: number, height: number) {
        const area = width * height * 5; // генерация с запасом
        const count = area * this.starDensity;
        for (let i = 0; i < count; i++) {
            this.stars.push(new Star(
                Math.random() * width * 5 - width * 2,
                Math.random() * height * 5 - height * 2,
                Math.random() * 1.5 + 0.3,
                Math.random() * 0.5 + 0.4,
            ));
        }
    }
    render(){
        // this.duration = Math.min(this.score.duration, this.score.loop_duration)
        requestAnimationFrame(()=>{this._render()})
    }
    private _render() {
        this.ctx.clearRect(0, 0, this.w, -this.h);
        this.ctx.save();
        this.ctx.scale(1, -1); // вернуть нормальную ориентацию
        for (const star of this.stars) {
            const x = star.x + this.view.center.x * this.starParallax;
            const y = star.y + this.view.center.y * this.starParallax;
            if (x < 0 || x > this.width || y < 0 || y > this.height) continue;

            this.ctx.beginPath();
            this.ctx.arc(x, y, star.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
            this.ctx.fill();
        }
        this.ctx.restore();
        for (let con of this.nodeSpace.connectors) {
            con.render(this.view);
        }
        // console.log(this.nodeSpace.nodes);
        for (let node of this.nodeSpace.nodes) {
            node.render(this.view);
        }
        this.nodeSpace.outputNode.render(this.view);
    }
    drugNode(x:number, y:number){
        const s = this.view.selected;
        s.offset.start = this.view.calcDim(s.drugged_x - x)*1.5;
        s.offset.pitch = this.view.calcDim(s.drugged_y - y)*1.5;
    }
    hitScan(x:number, y:number, radius:number, ctrl:boolean, alt:boolean){
        ctrl = ctrl;
        alt = alt;
        this.view.hovered.elements = [];
        for (let con of this.nodeSpace.connectors){
            const h = con.hitScan(x, y, radius);
            if (h) this.view.hovered.elements = [h];
        }
        for (let node of this.nodeSpace.nodes){
            const scan = node.hitScan(x, y, radius);
            if (scan) this.view.hovered.elements = [scan];
        } 
        const scan = this.nodeSpace.outputNode.hitScan(x,y,radius);
        if (scan) this.view.hovered.elements = [scan];
    }
}