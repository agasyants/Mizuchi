type MenuItem = {
    label: string;
    callback?: () => void;
    submenu?: MenuItem[];
};

export default class ContextMenu {
    div: HTMLDivElement;
    rootMenu: MenuItem[] = [];
    menuStack: MenuItem[][] = [];
    clickX: number = 0;
    clickY: number = 0;

    constructor() {
        this.div = document.createElement("div");
        this.div.tabIndex = 0;
        this.div.style.position = "absolute";
        this.div.style.display = "none";
        this.div.style.zIndex = "1000";
        this.div.style.backgroundColor = "white";
        this.div.style.border = "1px solid black";
        this.div.style.font = "10px Arial";
        this.div.style.fontWeight = "bold";
        this.div.style.maxHeight = "100px";
        this.div.style.overflowY = "auto";
    
        this.div.style.scrollbarWidth = "none"; // Firefox
        (this.div.style as any).msOverflowStyle = "none"; // IE, Edge
        this.div.classList.add("hide-scrollbar");
    
        const style = document.createElement("style");
        style.innerHTML = `
          .context-item {
            cursor: pointer;
            padding: 2px 4px;
            border-top: 2px solid black;
          }
          .context-item:first-child {
            border-top: none;
          }
          .context-item:hover {
            background-color: yellow;
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `;
        document.head.appendChild(style);
        document.body.appendChild(this.div);
    
        this.div.addEventListener("blur", () => this.hide());
    }
    setRootMenu(items: MenuItem[]) {
        this.rootMenu = items;
        this.menuStack = [];
    }

    show(x: number, y: number, wx:number, wy:number) {
        this.menuStack = [];
        this.clickX = x;
        this.clickY = y;
        this.openMenu(this.rootMenu);
        this.div.style.left = wx + "px";
        this.div.style.top = wy + "px";
        this.div.style.display = "block";
        this.div.focus(); // Focus the menu to capture keyboard events
    }

    hide() {
        this.div.style.display = "none";
    }

    private openMenu(menu: MenuItem[]) {
        this.menuStack.push(menu);
        this.renderMenu(menu);
    }

    private goBack() {
        this.menuStack.pop();
        const previous = this.menuStack[this.menuStack.length - 1];
        this.renderMenu(previous);
    }

    private renderMenu(menu: MenuItem[]) {
        this.div.innerHTML = "";
        if (this.menuStack.length > 1) {
            const back = document.createElement("div");
            back.className = "context-item";
            back.innerHTML = "← Back";
            back.addEventListener("click", () => this.goBack());
            this.div.appendChild(back);
        }
        for (const item of menu) {
            const el = document.createElement("div");
            el.className = "context-item";
            el.innerHTML = item.label + (item.submenu ? " ▶" : "");

            if (item.submenu) {
                el.addEventListener("click", () => this.openMenu(item.submenu!));
            } else if (item.callback) {
                el.addEventListener("click", () => {
                    item.callback!();
                    this.hide();
                });
            }
            this.div.appendChild(el);
        }
    }

    addItem(label: string, callback: () => void) {
        this.rootMenu.push({ label, callback });
    }
    addSubmenu(label: string, submenu: MenuItem[]) {
        this.rootMenu.push({ label, submenu });
    }
    clear() {
        this.rootMenu = [];
    }
}