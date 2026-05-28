import r2wc from "@r2wc/react-to-web-component";
import LolcryptionApp from "../../components/lolcryption-app/LolcryptionApp";

const WebLolcryptionApp = r2wc(LolcryptionApp);
customElements.define("web-lolcryption-app", WebLolcryptionApp);