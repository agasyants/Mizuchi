import Note from "./note";
import OscDrawer from "./osc_drawer";
import OscFunction, { Point } from "./osc_function";
import Oscillator from "./oscillator";
import Mix from "./mix";
import Track from "./track";
import Instrument from "./instrument";
import Score from "./score";

export default class Mizuchi{
    constructor(){
        const OscCanvas = document.getElementById('OscCanvas') as HTMLCanvasElement;
        if (!OscCanvas) return
        const OscF = new OscFunction();
        const drawer = new OscDrawer(OscCanvas, OscF);
        const osc = new Oscillator(OscF);
        const mix = new Mix(103);
        const track1 = new Track(new Instrument(osc));
        OscCanvas.onselectstart = function () { return false; }
        OscCanvas.addEventListener('dblclick', (e) => {
            console.log(OscF.basics, OscF.handles)
            const rect = OscCanvas.getBoundingClientRect();
            const x = (e.clientX - rect.left)/rect.width;
            const y = (e.clientY - rect.top)/rect.height-0.5;
            drawer.doubleInput(x,y);
            drawer.render();
        });
        OscCanvas.addEventListener('pointermove', (e) => {
            const rect = OscCanvas.getBoundingClientRect();
            const x = (e.clientX - rect.left)/rect.width;
            const y = (e.clientY - rect.top)/rect.height-0.5;
            drawer.findPoint(x,y,0.06);
            drawer.render();
        });
        OscCanvas.addEventListener('pointerdown', () => {
            drawer.drugged = true;
        });
        OscCanvas.addEventListener('pointerup', () => {
            drawer.drugged = false;
        });
        OscCanvas.addEventListener('pointerleave', () => {
            drawer.render_handles = false;
            drawer.render();
        });
        OscCanvas.addEventListener('pointerover', () => {
            drawer.render_handles = true;
        });
        const SinePreset = document.getElementById('Sine') || document.createElement('div');
        SinePreset.addEventListener('click', () => {
            OscF.basics = [new Point(0,0), new Point(0.25,1),new Point(0.5,0),new Point(0.75,-1),new Point(1,0)];
            OscF.handles = [new Point(0,1), new Point(0.5,1),new Point(0.5,-1),new Point(1,-1)];
            drawer.render();
        });
        const SawPreset = document.getElementById('Saw') || document.createElement('div');
        SawPreset.addEventListener('click', () => {
            OscF.basics = [new Point(0, 0), new Point(0.5, 1), new Point(0.5, -1),new Point(1, 0)];
            OscF.handles = [new Point(0.25,0.5), new Point(0.5,0), new Point(0.75,-0.5)];
            drawer.render();
        });
        const SquarePreset = document.getElementById('Square') || document.createElement('div');
        SquarePreset.addEventListener('click', () => {
            OscF.basics = [new Point(0, 0), new Point(0, 1), new Point(0.5, 1), new Point(0.5, -1), new Point(1, -1),new Point(1, 0)];
            OscF.handles = [new Point(0,0.5), new Point(0.25,1),new Point(0.5,0),new Point(0.75,-1),new Point(1,-0.5)];
            drawer.render();
        });
        const TrianglePreset = document.getElementById('Triangle') || document.createElement('div');
        TrianglePreset.addEventListener('click', () => {
            OscF.basics = [new Point(0, 0), new Point(0.25, 1),new Point(0.75, -1), new Point(1,0)];
            OscF.handles = [new Point(0.125,0.5), new Point(0.5,0),new Point(0.875,-0.5)];
            drawer.render();
        });
        const OscSettings = document.getElementById('OscSettings') || document.createElement('div');
        const InstSettings = document.getElementById('InstSettings') || document.createElement('div');
        const GenerateButton = document.getElementById('Generate') || document.createElement('div');
        GenerateButton.addEventListener('click', () => {
            let score1 = new Score();
            score1.addNotes([
                new Note("A2",0,2),
                new Note("D2",2,4),
                
            ])
            track1.scores.push(score1);
            track1.scores.push(score1);
            track1.scores.push(score1);
            track1.scores.push(score1);
            mix.addTrack(track1);
            console.log(mix);

        })
        const PlayButton = document.getElementById('Play') || document.createElement('div');
        PlayButton.addEventListener('click', () => {
            mix.mixTracks();
        })  
    }
}