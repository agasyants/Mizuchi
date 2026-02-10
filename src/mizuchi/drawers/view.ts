import hovered from "../classes/hovered";
import { NodeSelection } from "../classes/selection";
import Curve from "../curves/curve";

export default class View {
    constructor(public ctx: CanvasRenderingContext2D) {}

    color: {back:string, main:string, hovered:string, selected:string} = {back:'black', main:'white', hovered:'yellow', selected:'blue'}

    width: number = 0;
    height: number = 0;
    
    hovered:hovered = new hovered();
    selected:NodeSelection = new NodeSelection();

    center: { x: number, y: number } = { x: 0, y: 0 };
    scale: number = 1;

    down: { x: number, y: number } = { x: 0, y: 0 };

    // Convert world X to screen X
    calcX(x: number): number {
        return (x + this.center.x) * this.scale;
    }

    // Convert world Y to screen Y
    calcY(y: number): number {
        return (y + this.center.y) * this.scale;
    }

    // Convert screen X to world X
    calcToX(x: number): number {
        return (x * devicePixelRatio - this.width / 2) / this.scale - this.center.x;
    }

    // Convert screen Y to world Y
    calcToY(y: number): number {
        return (y * devicePixelRatio - this.height / 2) / this.scale - this.center.y;
    }

    // Convert dimension from world to screen
    calcDim(dim: number): number {
        return dim * this.scale;
    }

    // Get screen X coordinate including canvas center offset
    getScreenX(x: number): number {
        return this.calcX(x) + this.width / 2;
    }

    // Get screen Y coordinate including canvas center offset
    getScreenY(y: number): number {
        return -this.calcY(y) - this.height / 2;
    }

    // Get screen coordinates from world position
    getScreenPos(x: number, y: number): { x: number, y: number } {
        return {
            x: this.getScreenX(x),
            y: this.getScreenY(y)
        };
    }

    // Zoom to cursor position
    zoom(delta: number, was: [x: number, y: number]) {
        const zoomFactor = this.scale * delta / 2;
        const newScale = this.scale - zoomFactor;

        if (newScale < 0.3 || newScale > 14) return;

        // Adjust center so zoom focuses on pointer
        const [x, y] = was;
        this.center.x -= x * zoomFactor;
        this.center.y -= y * zoomFactor;

        this.scale = newScale;
    }

    // Calculate center from mouse move
    calcCenter(x: number, y: number) {
        this.center.x = (this.down.x + x) / this.scale * devicePixelRatio;
        this.center.y = (this.down.y + y) / this.scale * devicePixelRatio;
    }

    // Store offset when panning starts
    calcDown(x: number, y: number) {
        this.down.x = this.center.x * this.scale / devicePixelRatio - x;
        this.down.y = this.center.y * this.scale / devicePixelRatio - y;
    }

    // Update canvas size
    setSize(w: number, h: number) {
        this.width = w;
        this.height = h;
    }

    getColor(obj:any):string{
        if (this.selected.elements.includes(obj)){
            return this.color.selected;
        } else if (this.hovered.elements.includes(obj)){
            return this.color.hovered;
        } else {
            return this.color.main;
        }
    }

    // Clear canvas
    clear(color: string = "#000000") {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Draw rectangle with optional rounded corners and fill
    drawSquare(x: number, y: number, width: number, height: number, color: string, radius: number = 0, fill: boolean = true) {
        const pos = this.getScreenPos(x, y);
        const w = this.calcDim(width);
        const h = this.calcDim(height);

        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.arcTo(pos.x + w, pos.y, pos.x + w, pos.y + h, radius);
        ctx.arcTo(pos.x + w, pos.y + h, pos.x, pos.y + h, radius);
        ctx.arcTo(pos.x, pos.y + h, pos.x, pos.y, radius);
        ctx.arcTo(pos.x, pos.y, pos.x + w, pos.y, radius);
        ctx.closePath();

        if (fill) {
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            ctx.strokeStyle = color;
            ctx.stroke();
        }
    }

    // Draw filled or stroked circle
    drawCircle(x:number, y:number, radius:number, color:string, fill:boolean = true, width:number = 2) {
        const pos = this.getScreenPos(x, y);
        const r = radius * Math.sqrt(this.scale) * 1.1;

        const ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, 2 * Math.PI);

        if (fill) {
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.stroke();
        }

        ctx.closePath();
    }

    // Draw pin with border
    drawPin(x: number, y: number, radius: number, border: number, colorIn: string, colorOut: string) {
        this.drawCircle(x, y, radius + border, colorOut);
        this.drawCircle(x, y, radius - border, colorIn);
    }

    // Draw framed panel with outer and inner colors
    drawFrame(x: number, y: number, width: number, height: number, border: number, mainColor: string, frameColor: string, radius: number = 0) {
        const b = border / this.scale;
        this.drawSquare(x - b, y + b, width + b * 2, height + b * 2, mainColor, radius * 2);
        this.drawSquare(x + b, y - b, width - b * 2, height - b * 2, frameColor, radius);
    }

    // Draw centered text
    drawText(x: number, y: number, maxWidth: number, maxHeight: number, text: string, color:string) {
        const pos = this.getScreenPos(x, y);
        const w = this.calcDim(maxWidth);
        const h = this.calcDim(maxHeight);
        const size = Math.min(w, h)/(text.length-2)

        const ctx = this.ctx;
        ctx.save();
        ctx.scale(1, -1);
        ctx.fillStyle = color;
        ctx.font = `${size}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, pos.x+w/2, -pos.y-h/2);
        ctx.restore();
    }

    // Draw line from point A to B
    drawLine(x1: number, y1: number, x2: number, y2: number, width: number, color: string) {
        const p1 = this.getScreenPos(x1, y1);
        const p2 = this.getScreenPos(x2, y2);

        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.closePath();
    }

    // Draw a quadratic curve from function basics and handles
    drawCurve(func:Curve, color: string) {
        const ctx = this.ctx;
        ctx.beginPath();
        const start = this.getScreenPos(func.basics[0].x, func.basics[0].y);
        ctx.moveTo(start.x, start.y);

        for (let i = 0; i < func.handles.length; i++) {
            const handle = this.getScreenPos(func.handles[i].x, func.handles[i].y);
            const end = this.getScreenPos(func.basics[i + 1].x, func.basics[i + 1].y);
            ctx.quadraticCurveTo(handle.x, handle.y, end.x, end.y);
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.closePath();
    }
}
