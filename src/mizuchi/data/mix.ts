import Score from "./score";
import Track from "./track";
import { ScoreSelection, TrackSelection } from "../classes/selection";
import IdComponent, { IdArray } from "../classes/id_component";
import CommandPattern from "../classes/CommandPattern";
import Note from "../classes/note";
import NodeSpace from "../nodes/node_space";
import FromTrackNode from "../nodes/track_node";
import Node from "../nodes/node";

export default class Mix {
    tracks = new IdArray<Track>();
    nodeSpace:NodeSpace = new NodeSpace(0,0,0,this);
    deleted:any = [];

    bpm: number = 120;
    start:   number = 0;
    loop_start:number = 0;
    loop_end:  number = 128;
    playback:    number = 0;
    sampleRate:number = 44100;
    looped:  boolean = true;

    commandPattern = new CommandPattern();

    selected:{scores:ScoreSelection, tracks:TrackSelection} = {scores:new ScoreSelection(), tracks:new TrackSelection()};
    tracks_number_on_screen:number = 6;

    fullIDs:{[key:string]:any}[] = [];
    
    constructor(){
        let data = localStorage.getItem('key');
        if (data){
            console.log(data);
            this.load(JSON.parse(data));
        } else {
            this.create(new Track('track '+ (this.tracks.length+1).toString(), this, 0), 0);
            this.create(new Track('track '+ (this.tracks.length+1).toString(), this, 1), 1);
            this.tracks.increment = 2;
            const mixNode = new FromTrackNode(-140, 20, 1, this);
            this.nodeSpace.create(mixNode);
            this.nodeSpace.connectNodes(mixNode, this.nodeSpace.outputNode, 0);
        }
    }
    getFullId(){
        return "";
    }
    toJSON() {
        return {
            bpm: this.bpm,
            start: this.start,
            loop_start: this.loop_start,
            loop_end: this.loop_end,
            looped: this.looped,
            tracks_number_on_screen: this.tracks_number_on_screen,
            MIX_NODE_SPACE: this.nodeSpace,
            TRACKS: this.tracks,
            CommandPattern: this.commandPattern,
            del: '',
            deleted: this.deleted
        }
    }
    static isStringNumber(str:string): boolean{
        return /^-?\d+(\.\d+)?$/.test(str);
    }
    findByFullID(fullId:string): any {
        // console.log("fullId:", fullId)
        if (!fullId) return this;
        if (Mix.isStringNumber(fullId)){
            return this.deleted[Number(fullId)];
        }
        if (fullId.startsWith(Track.getSeparator())){
            fullId = fullId.slice(Track.getSeparator().length);
            const id = parseInt(fullId, 10)
            return IdComponent.findByID(this.tracks, id).findByFullID(fullId.slice(String(id).length));
        } 
        else if (fullId.startsWith(Node.getSeparator())){
            fullId = fullId.slice(Node.getSeparator().length);
            const id = parseInt(fullId, 10)
            console.log('b')
            return IdComponent.findByID(this.nodeSpace.nodes, id).findByFullID(fullId.slice(String(id).length));
        }
        console.error('mix "'+String(fullId)+'"');
        return null;
    }
    save() {
        const seen = new Set();
        const replacer = (key: string, value: unknown) => {
            if (key === 'del')
                for (let del of this.deleted)
                    del.parent = this;
            if (typeof value === "object" && value !== null){
                if (seen.has(value)) {
                    console.error("ERRRROORR", key, value);
                    return undefined;
                }
                if (value instanceof IdComponent){
                    if (value.parent === null) {
                        if (!this.deleted.includes(value)) { 
                            console.log('finded');
                            this.deleted.push(value);
                        }
                        return String(this.deleted.indexOf(value));
                    }
                } 
                seen.add(value);
            } 
            return value;
        };
        const log = JSON.stringify(this, replacer)
        console.log(log);
        console.log("Start: ", this);
        localStorage.setItem('key', log);
    }
    setAsideFullID(fullID:string, setter:(value: any) => void) {
        this.fullIDs.push({fullID, setter});
    }
    load(json:any){
        console.log(json);
        this.bpm = json.bpm;
        this.start = json.start;
        this.loop_start = json.loop_start;
        this.loop_end = json.loop_end;
        this.looped = json.looped;
        this.tracks_number_on_screen = json.tracks_number_on_screen;
        
        this.nodeSpace = NodeSpace.fromJSON(json.MIX_NODE_SPACE, this, this);
        const tracks = []
        for (let track of json.TRACKS.data)
            tracks.push(Track.fromJSON(track, this, this));
        this.tracks = IdArray.fromJSON(tracks, json.TRACKS.increment);

        for (let entry of this.fullIDs) {
            const found = this.findByFullID(entry.fullID);
            if (found) {
                entry.setter(found);
            }
        }
        for (let del of json.deleted){
            console.log('del', del);
            if (del.sep == Track.getSeparator()){
                this.deleted.push(Track.fromJSON(del, null, this));
            } else if (del.sep == Score.getSeparator()) {
                this.deleted.push(Score.fromJSON(del, null));
            } else if (del.sep == Note.getSeparator()) {
                this.deleted.push(Note.fromJSON(del, null));
            } else if (del.sep == Node.getSeparator()) {
                // this.deleted.push(Node.fromJSON(del, null, this));
            } else {
                console.log('else');
                this.deleted.push(del);
            }
        }

        this.commandPattern = CommandPattern.fromJSON(json.CommandPattern, this);
        console.log(this.commandPattern);
        console.log("Final: ", this);
    }
    create(track:Track, index:number){
        track.parent = this;
        this.tracks.splice(index, 0, track);
    }
    delete(track:Track, index:number){
        track.parent = null;
        const new_track = this.tracks.splice(index, 1)[0];
        if (new_track != track) console.error("track don't fits index");
    }
    move(sel:Track|Score, [start, dur, loop, rel]:number[]){
        if (sel instanceof Track){
            const index = this.tracks.indexOf(sel);
            if (index > -1) {
                this.tracks.splice(index, 1);
                this.tracks.splice(index, 0, sel);
            }
        } else if (sel instanceof Score){
            const score = sel;
            score.absolute_start = start;
            score.duration = dur;
            score.loop_duration = loop;
            score.relative_start = (score.loop_duration + (rel) % score.loop_duration) % score.loop_duration;
        }
    }
    select(input: Track[]|Score[], start:number, end:number) {
        if (input.length == 0)
            this.selectScores([],start,end);
        else if (input.every(item => item instanceof Track))
            this.selectTracks(input);
        else if (input.every(item => item instanceof Score))
            this.selectScores(input, start, end);
        else
            console.error('Invalid input: must be an array of Tracks or Scores.');
    }
    selectTracks(tracks:Track[]){
        // console.log("tracks");        
        if (tracks.length){
            for (let track of tracks){
                const index = this.selected.tracks.elements.indexOf(track);
                if (index > -1) {
                    this.selected.tracks.elements.splice(index, 1);
                    this.selected.tracks.index.splice(index, 1);
                } else {
                    this.selected.tracks.elements.push(track);
                    this.selected.tracks.index.push(this.tracks.indexOf(track));
                }
            }
        }
    }
    selectScores(scores:Score[], start:number, end:number){
        // console.log("scores");       
        // console.log(start,end);
        for (let score of scores) {
            const index = this.selected.scores.elements.indexOf(score);
            if (index > -1) {
                this.selected.scores.elements.splice(index, 1);
                this.selected.scores.track_index.splice(index, 1);
            } else {
                this.selected.scores.elements.push(score);
                // Find track index for the score
                for (let i = 0; i < this.tracks.length; i++) {
                    if (this.tracks[i].scores.includes(score)) {
                        this.selected.scores.track_index.push(i);
                        break;
                    }
                }
            }
        }
        // Find start and end
        const s = this.selected.scores;
        s.start = Math.min(start,end)*8;
        s.end = (Math.max(start,end))*8;
        for (let i = 0; i < s.elements.length; i++){
            if (s.elements[i].absolute_start < s.start) s.start = s.elements[i].absolute_start;
            if (s.elements[i].absolute_start + s.elements[i].duration > s.end) s.end = s.elements[i].absolute_start + s.elements[i].duration;
        }
    }
}