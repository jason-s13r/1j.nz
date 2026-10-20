import r2wc from "@r2wc/react-to-web-component";
import CoalitionCalculator from "./components/CoalitionCalculator";

const WebCoalitionCalculator = r2wc(CoalitionCalculator);
customElements.define("web-coalition-calculator-app", WebCoalitionCalculator);
