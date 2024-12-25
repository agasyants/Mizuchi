import Note from "../classes/note";
// import OscDrawer from "../drawers/osc_drawer";
import { BasicPoint, HandlePoint } from "../data/function";
import Mix from "../data/mix";
import ScoreDrawer from "../drawers/score_drawer";
import MixDrawer from "../drawers/mix_drawer";
import Mixer from "./mixer";
// import { Delay, Distortion, Distortion2, Distortion3, Smothstep } from "../classes/audio_effects";
// import { Set } from "../classes/CommandPattern";
// import MixerWorklet from "./MixerWorklet";
import WindowController from "../classes/WindowController";
import { NoteInput, SumNode } from "../classes/node";
import Mapping from "../data/mapping_function";


export default class Mizuchi{
    constructor(){
        let mix:Mix = new Mix();

        const start_input = document.getElementById('start') as HTMLInputElement;
        start_input.addEventListener("change", () => {
            mix.start = Number(start_input.value);
        }) 
        window.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        })

        const TestButton = document.getElementById('Test') || document.createElement('div');
        TestButton.addEventListener('click', () => {
        })

        // const oscDrawer = new OscDrawer(OscCanvas, mix.tracks[0].inst.osc.oscFunction);

        const scoreCanvas = document.getElementById('ScoreCanvas') as HTMLCanvasElement;
        const score_drawer = new ScoreDrawer(scoreCanvas, mix.tracks[0].scores[0]);
        const score_window = new WindowController('score-canvas-wrapper', score_drawer, 12, 810, 390);

        const mixCanvas = document.getElementById('MixCanvas') as HTMLCanvasElement;
        const mix_div = document.getElementById('mix-canvas-wrapper') as HTMLDivElement;
        if (mixCanvas && mix_div){
            const rect = mix_div.getBoundingClientRect();
            const mixDrawer = new MixDrawer(mixCanvas, mix, score_window, rect.width, rect.height);
            const mixer = new Mixer(mix, mixDrawer);
            const mixNode = new SumNode(0,0);
            mix.nodes = [mixNode]
            mix.outputNode.setInput(0, mixNode.output);
            // let f = new OscFunction([[new BasicPoint(0,-1), new BasicPoint(0.5,0), new BasicPoint(1,1)],[new HandlePoint(0.5,-1,1,0), new HandlePoint(0.5,1,0,1)]]);
            let i = 0;
            for (let track of mix.tracks) {
                const node = new NoteInput(0,0,track,mix,new Mapping(0,1,-1,1,[new BasicPoint(0, 0), new BasicPoint(0.25, 1),new BasicPoint(0.75, -1), new BasicPoint(1,0)], [new HandlePoint(0.125,0.5), new HandlePoint(0.5,0),new HandlePoint(0.875,-0.5)])); 
                node.output.connected = track.outputNode.inputs[0];
                track.nodes.push(node);
                mixNode.addInput(node.output);
                const TestButton = document.getElementById("Test");
                if (TestButton){
                    TestButton.addEventListener("click", () => {
                        console.log(track.name);
                        for (let playback=0; playback<12; playback++){
                            mix.playback = playback*mix.sampleRate
                            console.log(node.get());
                        }
                    })
                } i++;
            }
            console.log(mix.outputNode);  
            
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
        const GenerateButton = document.getElementById('Generate') || document.createElement('div');    
        GenerateButton.addEventListener('click', () => {
            score_drawer.score.notes = [
                new Note('A2', 0, 2),
                new Note('A2', 3, 2),
                new Note('A2', 6, 2),
                new Note('A2', 9, 2),
                new Note('A2', 12, 2),
                new Note('D2', 14, 1),
                new Note('D2', 15, 1),
                new Note('D2', 16, 2),
                new Note('D2', 19, 2),
                new Note('F2', 22, 2),
                new Note('F2', 25, 2),
                new Note('F2', 28, 2),
                new Note('F2', 31, 1),
            ];
            score_drawer.render();
        })
    }
}