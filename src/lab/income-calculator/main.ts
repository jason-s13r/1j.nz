import r2wc from "@r2wc/react-to-web-component";
import IncomeCalculator from "./components/IncomeCalculator";

const WebIncomeCalculator = r2wc(IncomeCalculator);
customElements.define("web-income-calculator-app", WebIncomeCalculator);
