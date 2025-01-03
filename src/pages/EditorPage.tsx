import React, { useEffect } from "react";

const EditorPage: React.FC = () => {
  useEffect(() => {
    import('../main').then(() => {
      console.log("main.ts is loaded");
    }).catch((error) => {
      console.error("Error loading main.ts", error);
    });
  }, []);

  return (
    <div id="app">
      <div style={{ backgroundColor: "white", display: "flex", flex: "0 0 50px" }}>
        <img id="app_image" src="src/img/UzumeLogo2.png" alt="Uzume Logo" />
        <h1 style={{margin: "5px"}}> Mizuchi </h1>
        <input type="number" id="bpm" style={{ width: "40px", height: "12px", margin: "19px" }} />
        <div id="Inputs">
          <input type="number" defaultValue={0} id="start"/>
          <input type="number" defaultValue={128} id="end"/>
          <button id="Generate">Generate</button>
          <button id="Test">Test</button>
        </div>
      </div>
      <div id="mix-canvas-wrapper" style={{ flex: "1 1 auto" }}>
        <canvas id="MixCanvas" style={{ backgroundColor: "black" }}></canvas>
      </div>
      <div style={{ display: "flex", position: "absolute" }}>
        <div style={{ padding: "5px" }}>
          <canvas id="OscCanvas" height="250" width="375" style={{ backgroundColor: "black", display: "none" }}></canvas>
        </div>
      </div>
      <div id="score-canvas-wrapper" style={{ position: "absolute" }}>
        <canvas id="ScoreCanvas" style={{ backgroundColor: "black" }}></canvas>
      </div>
    </div>
  );
};

export default EditorPage;