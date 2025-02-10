import Drawer from "../drawers/Drawer";

export default class WindowController {
    drawer: Drawer;
    private container: HTMLDivElement;
    private maxWidth: number = 200; // Minimum allowed width for resizing
    private maxHeight: number = 200; // Minimum allowed height for resizing
    lastCall:number=0;
    private isResizing:{
        Right:boolean, 
        Left:boolean, 
        Top:boolean, 
        Bottom:boolean
    } = {
        Right:false, 
        Left:false, 
        Top:false, 
        Bottom:false
    };
    
    dragWindow:{cx:number,cy:number,cliX:number,cliY:number}|null = null;
  
    constructor(containerId:string, drawer:Drawer, public range:number, width:number, height:number) {
        const container = document.getElementById(containerId);
        if (!container || !(container instanceof HTMLDivElement)) {
            throw new Error("Invalid container Id or container is not a div.");
        }
    
        this.container = container;
        this.drawer = drawer;
        this.drawer.canvas.style.margin = range/2 + "px"
        this.container.style.width = width + "px";
        this.container.style.height = height + "px";
        this.container.style.top = "0px";
        this.container.style.left = "0px";
    
        this.drawer.setCanvasSize(width-range, height-range);
        this.drawer.render();
        this.initEventListeners();
        this.close();
    }
  
    private initEventListeners() {
        // Resizing
        window.addEventListener("mousemove", this.onResizeCursor.bind(this));
        this.container.addEventListener("mousedown", this.onResizeStart.bind(this));
        window.addEventListener("mousemove", this.onResizeMove.bind(this));
        window.addEventListener("mouseup", this.onResizeEnd.bind(this));

        // Dragging
        this.container.addEventListener("mousedown", this.onMouseDown.bind(this));
        window.addEventListener("mousemove", this.onMouseMove.bind(this));
        window.addEventListener("mouseup", this.onMouseUp.bind(this));
    }
    
    clickCount = 0;
    private onMouseDown(event: MouseEvent) {
        this.drawer.canvas.focus();
        if (this.isResizing.Bottom||this.isResizing.Right||this.isResizing.Left||this.isResizing.Top) return;
        if (event.button == 2) {
            this.drawer.stopRender=true;
            this.clickCount++;
            if (this.clickCount == 2) { // if double click close the window
                this.close();
                this.clickCount = 0;
            } else {
                this.dragWindow = { // else start drugging
                    cx: event.clientX, 
                    cy: event.clientY, 
                    cliX: parseFloat(this.container.style.left || "0"), 
                    cliY: parseFloat(this.container.style.top || "0")
                };
            }
            setTimeout(() => this.clickCount = 0, 300);
        }
    }
  
    private onMouseMove(event: MouseEvent) {
        if (this.dragWindow) {
            let x = this.dragWindow.cliX + event.clientX - this.dragWindow.cx;
            let y = this.dragWindow.cliY + event.clientY - this.dragWindow.cy;

            const width = parseFloat(this.container.style.width || "0");
            const height = parseFloat(this.container.style.height || "0");

            // Prevent dragging outside the window bounds
            x = Math.max(0, Math.min(x, window.innerWidth - width));
            y = Math.max(0, Math.min(y, window.innerHeight - height));

            this.container.style.left = `${x}px`;
            this.container.style.top = `${y}px`;
        } 
    }
  
    private onMouseUp(event: MouseEvent) {
        this.drawer.stopRender=false;
        if (event.button == 2)
            this.dragWindow = null;
    }
  
    private onResizeCursor(event: MouseEvent) {
        const rect = this.container.getBoundingClientRect();
        const isNearRight = Math.abs(event.clientX - rect.right) < this.range;
        const isNearLeft = Math.abs(event.clientX - rect.left) < this.range;
        const isNearTop = Math.abs(event.clientY - rect.top) < this.range;
        const isNearBottom = Math.abs(event.clientY - rect.bottom) < this.range;
    
        // Устанавливаем курсор в зависимости от стороны
        if ((isNearRight && isNearBottom) || (isNearLeft && isNearTop)) {
            this.container.style.cursor = "nwse-resize"; // Диагональ: нижний-правый или верхний-левый
        } else if ((isNearRight && isNearTop) || (isNearLeft && isNearBottom)) {
            this.container.style.cursor = "nesw-resize"; // Диагональ: верхний-правый или нижний-левый
        } else if (isNearRight || isNearLeft) {
            this.container.style.cursor = "ew-resize"; // Горизонтальное изменение
        } else if (isNearTop || isNearBottom) {
            this.container.style.cursor = "ns-resize"; // Вертикальное изменение
        } else {
            this.container.style.cursor = "default"; // Нет изменения размера
        }
    }
    
  
    private onResizeStart(event: MouseEvent) {
        if (event.button != 2) return;
        const rect = this.container.getBoundingClientRect();
    
        this.isResizing = {
            Right: Math.abs(event.clientX - rect.right) < this.range,
            Left: Math.abs(event.clientX - rect.left) < this.range,
            Top: Math.abs(event.clientY - rect.top) < this.range,
            Bottom: Math.abs(event.clientY - rect.bottom) < this.range
        };        
    
        if (this.isResizing.Right || this.isResizing.Left || this.isResizing.Top || this.isResizing.Bottom) {
            event.preventDefault();
        }
    }
  
    private onResizeMove(event: MouseEvent) {
        if (this.isResizing.Right || this.isResizing.Left || this.isResizing.Top || this.isResizing.Bottom) {
            const rect = this.container.getBoundingClientRect();
            let newWidth = rect.width;
            let newHeight = rect.height;
            let newLeft = rect.left;
            let newTop = rect.top;
    
            // width change
            if (this.isResizing.Right) {
                newWidth = event.clientX - rect.left + this.range/2;
            } else if (this.isResizing.Left) {
                newWidth = rect.right - event.clientX + this.range/2;
                newLeft = event.clientX - this.range/2;
            }
    
            // height change
            if (this.isResizing.Bottom) {
                newHeight = event.clientY - rect.top + this.range/2;
            } else if (this.isResizing.Top) {
                newHeight = rect.bottom - event.clientY + this.range/2;
                newTop = event.clientY - this.range/2;
            }
    
            // Apply new size
            if (newWidth > this.maxWidth) {
                this.container.style.width = `${newWidth}px`;
                if (this.isResizing.Left) 
                    this.container.style.left = `${newLeft}px`;
            } else {
                newWidth = this.maxWidth;
            }
    
            if (newHeight > this.maxHeight) {
                this.container.style.height = `${newHeight}px`;
                if (this.isResizing.Top) 
                    this.container.style.top = `${newTop}px`;
            } else {
                newHeight = this.maxHeight;
            }
    
            // Apply canvas
            
            this.debounceSetSize(newWidth-this.range, newHeight-this.range);
        }
    }
    
    debounceSetSize(w:number,h:number){
        const now = Date.now();
        if (now - this.lastCall >= 16) {
            this.lastCall = now;
            this.drawer.setCanvasSize(w,h);
        }
    }
  
    private onResizeEnd() {
        this.isResizing = {Right: false, Left: false, Top: false, Bottom: false};
    }

    public close() {
        this.drawer.canvas.style.display = "none";
        this.container.style.display = "none";
        this.drawer.canvas.blur();
    }
  
    public open() {
        this.container.style.display = "block";
        this.drawer.canvas.style.display = "block";
        const rect = this.container.getBoundingClientRect();
        this.drawer.setCanvasSize(rect.width-this.range, rect.height-this.range);
        this.drawer.canvas.focus();
        this.drawer.render();
    }
}