import Mix from "../data/mix";
import ScoreDrawer from "../drawers/score_drawer";
import MixDrawer from "../drawers/mix_drawer";
import Mixer from "./mixer";
import WindowController from "../classes/WindowController";
import Score from "../data/score";
import NodeSpaceDrawer from "../drawers/node_space_drawer";
import BloomShader from "../classes/BloomShader";


export default class Mizuchi{
    constructor(){
        const resetButton = document.getElementById('test');
        if (resetButton){
            resetButton.addEventListener("click", () => {
                localStorage.setItem('key', '');
            })
        }
        const mix:Mix = new Mix();
        const start_input = document.getElementById('loop_start') as HTMLInputElement;
        start_input.addEventListener("change", () => {
            mix.loop_start = Number(start_input.value);
        });
        const end_input = document.getElementById('loop_end') as HTMLInputElement;
        end_input.addEventListener("change", () => {
            mix.loop_end = Number(end_input.value);
        });
        const loop_button = document.getElementById('loop') as HTMLInputElement;
        loop_button.addEventListener("change", () => {
            mix.looped = loop_button.checked;
        });
        window.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        })

        // const oscDrawer = new OscDrawer(OscCanvas, mix.tracks[0].inst.osc.oscFunction);

        const scoreCanvas = document.getElementById('ScoreCanvas') as HTMLCanvasElement;
        // Bloom для ScoreCanvas
        const scoreBloomCanvas = document.getElementById('ScoreBloomCanvas') as HTMLCanvasElement;
        const scoreBloom = new BloomShader(scoreCanvas, scoreBloomCanvas);
        const score_drawer = new ScoreDrawer(scoreCanvas, new Score(mix.tracks[0],0,0), mix, scoreBloom);
        const score_window = new WindowController('score-canvas-wrapper', score_drawer, 12, 810, 390);

        const nodeCanvas = document.getElementById('NodeSpaceCanvas') as HTMLCanvasElement;
        // Bloom для NodeSpaceCanvas  
        const nodeBloomCanvas = document.getElementById('NodeBloomCanvas') as HTMLCanvasElement;
        const nodeBloom = new BloomShader(nodeCanvas, nodeBloomCanvas);
        const node_space_drawer = new NodeSpaceDrawer(nodeCanvas, mix.nodeSpace, nodeBloom);
        const node_window = new WindowController('node-space-canvas-wrapper', node_space_drawer, 12, 810, 390);
        
        const mixCanvas = document.getElementById('MixCanvas') as HTMLCanvasElement;
        const mix_div = document.getElementById('mix-canvas-wrapper') as HTMLDivElement;

        
        const mixBloomCanvas = document.getElementById('MixBloomCanvas') as HTMLCanvasElement;
        const mixBloom = new BloomShader(mixCanvas, mixBloomCanvas);

        
        if (mixCanvas && mix_div)
        {
            const id_shower = document.getElementById('id_show');
            if (id_shower){
                id_shower.addEventListener("click", () => {
                    mixDrawer.show_id = !mixDrawer.show_id;
                    score_drawer.show_id = !score_drawer.show_id;
                })
            }

            const rect = mix_div.getBoundingClientRect();
            const mixDrawer = new MixDrawer(mixCanvas, mix, score_window, node_window, rect.width, rect.height, mixBloom);
            const mixer = new Mixer(mix, mixDrawer);
            console.log(mix.nodeSpace);  
            
            window.addEventListener("keydown", (e) => {
                if (e.code=="KeyS" && e.ctrlKey){
                    e.preventDefault();
                    mix.save();
                }
                if (e.code=="Space"){
                    e.preventDefault();
                    mixer.toggle();
                }
            });          
        }
        
        // const SinePreset = document.getElementById('Sine') || document.createElement('div');
        // SinePreset.addEventListener('click', () => {
        //     oscDrawer.commandPattern.addCommand(new Set(oscDrawer.oscFunction, [[new BasicPoint(0,0), new BasicPoint(0.25,1), new BasicPoint(0.5,0), new BasicPoint(0.75,-1), new BasicPoint(1,0)], [new HandlePoint(0,1,0,1), new HandlePoint(0.5,1,1,0),new HandlePoint(0.5,-1,0,1),new HandlePoint(1,-1,1,0)]]));
        //     oscDrawer.render();
        // });
        // const SawPreset = document.getElementById('Saw') || document.createElement('div');
        // SawPreset.addEventListener('click', () => {
        //     oscDrawer.commandPattern.addCommand(new Set(oscDrawer.oscFunction, [[new BasicPoint(0, 0), new BasicPoint(0.5, 1), new BasicPoint(0.5, -1),new BasicPoint(1, 0)], [new HandlePoint(0.25,0.5), new HandlePoint(0.5,0), new HandlePoint(0.75,-0.5)]]));
        //     oscDrawer.render();
        // });
        // const SquarePreset = document.getElementById('Square') || document.createElement('div');
        // SquarePreset.addEventListener('click', () => {
        //     oscDrawer.commandPattern.addCommand(new Set(oscDrawer.oscFunction, [[new BasicPoint(0, 0), new BasicPoint(0, 1), new BasicPoint(0.5, 1), new BasicPoint(0.5, -1), new BasicPoint(1, -1),new BasicPoint(1, 0)], [new HandlePoint(0,0.5), new HandlePoint(0.25,1),new HandlePoint(0.5,0),new HandlePoint(0.75,-1),new HandlePoint(1,-0.5)]]));
        //     oscDrawer.render();
        // });
        // const TrianglePreset = document.getElementById('Triangle') || document.createElement('div');
        // TrianglePreset.addEventListener('click', () => {
        //     oscDrawer.commandPattern.addCommand(new Set(oscDrawer.oscFunction, [[new BasicPoint(0, 0), new BasicPoint(0.25, 1),new BasicPoint(0.75, -1), new BasicPoint(1,0)], [new HandlePoint(0.125,0.5), new HandlePoint(0.5,0),new HandlePoint(0.875,-0.5)]]));
        //     oscDrawer.render();
        // });
    
        const BPM = <HTMLInputElement>document.getElementById('bpm');
        if (BPM) BPM.value = String(mix.bpm);
        if (BPM){
            BPM.addEventListener('change', () => {
                mix.bpm = Number(BPM.value);
            })
        }
        const shaderButton = document.getElementById('shader');
        if (shaderButton){
            shaderButton.addEventListener("click", () => {
                scoreBloom.show()
                mixBloom.show()
                nodeBloom.show()
            })
        }
    }
}