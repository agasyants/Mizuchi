import Note from "./note";
import OscDrawer from "./osc_drawer";
import { Point } from "./osc_function";
// import Oscillator from "./oscillator";
import Mix from "./mix";
// import Track from "./track";
// import Instrument from "./instrument";
import Score from "./score";
import ScoreDrawer from "./note_drawer";
import MixDrawer from "./mix_drawer";

export default class Mizuchi{
    constructor(){
        const OscCanvas = document.getElementById('OscCanvas') as HTMLCanvasElement;
        if (!OscCanvas) return
        const mix = new Mix(120);
        const drawer = new OscDrawer(OscCanvas, mix.tracks[0].inst.osc.oscFunction);
        
        mix.addTrack();
        mix.addTrack();
        mix.addTrack();

        const scoreCanvas = document.getElementById('ScoreCanvas') as HTMLCanvasElement;
        let score1 = new Score();
        mix.tracks[0].scores = [score1,score1,score1,score1];
        const score_drawer = new ScoreDrawer(scoreCanvas, score1);

        const mixCanvas = document.getElementById('MixCanvas') as HTMLCanvasElement;
        if (mixCanvas){
            const mixDrawer = new MixDrawer(mixCanvas, mix, drawer, score_drawer);
            const AddTrack = document.getElementById('AddTrack');
            if (AddTrack){
                AddTrack.addEventListener('click', () => mix.addTrack());
            }

            const AddScore = document.getElementById('AddScore');
            if (AddScore){
                AddScore.addEventListener('click', () => {
                    for (let track of mix.tracks){
                        track.scores.push(new Score);
                    } mixDrawer.render();
                })
                
            }
        }
        const SinePreset = document.getElementById('Sine') || document.createElement('div');
        SinePreset.addEventListener('click', () => {
            drawer.oscFunction.basics = [new Point(0,0), new Point(0.25,1),new Point(0.5,0),new Point(0.75,-1),new Point(1,0)];
            drawer.oscFunction.handles = [new Point(0,1,0,1), new Point(0.5,1,1,0),new Point(0.5,-1,0,1),new Point(1,-1,1,0)];
            drawer.render();
        });
        const SawPreset = document.getElementById('Saw') || document.createElement('div');
        SawPreset.addEventListener('click', () => {
            drawer.oscFunction.basics = [new Point(0, 0), new Point(0.5, 1), new Point(0.5, -1),new Point(1, 0)];
            drawer.oscFunction.handles = [new Point(0.25,0.5), new Point(0.5,0), new Point(0.75,-0.5)];
            drawer.render();
        });
        const SquarePreset = document.getElementById('Square') || document.createElement('div');
        SquarePreset.addEventListener('click', () => {
            drawer.oscFunction.basics = [new Point(0, 0), new Point(0, 1), new Point(0.5, 1), new Point(0.5, -1), new Point(1, -1),new Point(1, 0)];
            drawer.oscFunction.handles = [new Point(0,0.5), new Point(0.25,1),new Point(0.5,0),new Point(0.75,-1),new Point(1,-0.5)];
            drawer.render();
        });
        const TrianglePreset = document.getElementById('Triangle') || document.createElement('div');
        TrianglePreset.addEventListener('click', () => {
            drawer.oscFunction.basics = [new Point(0, 0), new Point(0.25, 1),new Point(0.75, -1), new Point(1,0)];
            drawer.oscFunction.handles = [new Point(0.125,0.5), new Point(0.5,0),new Point(0.875,-0.5)];
            drawer.render();
        });

        
        

        drawer.oscFunction.basics = [new Point(0, 0), new Point(0.25, 1),new Point(0.75, -1), new Point(1,0)];
        drawer.oscFunction.handles = [new Point(0.125,0.5), new Point(0.5,0),new Point(0.875,-0.5)];
        drawer.render();
        
        const BPM = <HTMLInputElement>document.getElementById('bpm');
        if (BPM){
            BPM.addEventListener('change', () => {
                mix.bpm = Number(BPM.value);
            })
        }
        const GenerateButton = document.getElementById('Generate') || document.createElement('div');
        GenerateButton.addEventListener('click', () => {
            score1.notes = [
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
            console.log(mix);
        })
        const PlayButton = document.getElementById('Play') || document.createElement('div');
        let audioContext:AudioContext|null = null;
        PlayButton.addEventListener('click', () => {
            if (!audioContext){
                audioContext = new AudioContext();
                let mixed = mix.mixTracks(audioContext.sampleRate);
                let audioBuffer = audioContext.createBuffer(1, mixed.length, audioContext.sampleRate);
                audioBuffer.copyToChannel(mixed, 0);
                let source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.start();
            }
        })  
        const StopButton = document.getElementById('Stop') || document.createElement('div');
        StopButton.addEventListener('click', () => {
            if (!audioContext) return;
            audioContext.close();
            audioContext = null;
        })
    }
}