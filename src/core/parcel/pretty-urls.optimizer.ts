import { Optimizer } from "@parcel/plugin";

export default new Optimizer({
  async optimize(opts) {
    const { bundle, contents } = opts;
    let code = contents.toString();
    code = code.replace(/href="([^"]*)\/page\/1\/index\.html"/g, 'href="$1/"');
    code = code.replace(/href="([^"]*)\/index\.html"/g, 'href="$1/"');
    return { contents: Buffer.from(code) };
  }
});