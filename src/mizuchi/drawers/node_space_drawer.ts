import { NodeSpace } from "../classes/node";
import Mix from "../data/mix";
import Drawer from "./Drawer";

export default class NodeSpaceDrawer extends Drawer {
    tabs:NodeSpace[] = [];
    nodeSpace:NodeSpace = new NodeSpace(0,0,0,new Mix());
    constructor(canvas:HTMLCanvasElement) {
        super(canvas);
    }
    render() {

    }
}