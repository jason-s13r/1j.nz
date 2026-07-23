import { useState } from "react";
import "./LolcryptionApp.scss";
import Lolcryption from "./Lolcryption";

export default function LolcryptionApp() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");

  const presets = ["Hello, World!", "The quick brown fox jumps over the lazy dog."];

  return (
    <div className="LolcryptionApp">
      <textarea
        id="textInput"
        placeholder="Hello, World!"
        value={text}
        onChange={(e) => setText(e.target.value)}
      ></textarea>

      <Lolcryption placeholder="Hello, World!" value={text} onChange={setOutput} />

      <div className="blurb">
        <h4>Try one of these:</h4>
        {output ? (
          <button className="repeat-button" data-repeat="recurse" onClick={() => setText(output)}>
            &#x27F3;
          </button>
        ) : (
          <></>
        )}
        {presets.map((preset, i) => (
          <button key={i} className="preset-button" onClick={() => setText(preset)}>
            {preset.slice(0, 50)}
            {preset.length > 50 ? "..." : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
