import r2wc from "@r2wc/react-to-web-component";
import Timer from "./components/Timer";

const WebTimer = r2wc(Timer, {
  props: {
    Hz: "number",
  },
});
customElements.define("web-timer", WebTimer);