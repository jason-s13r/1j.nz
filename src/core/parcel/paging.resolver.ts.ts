import { Resolver } from "@parcel/plugin";
import path from "node:path";
import fs from "node:fs";

export default new Resolver({
  async resolve(opts) {
    const { specifier } = opts;
    const basedir = path.join(__dirname, "..", "..", "..");

    const match = specifier.match(/^(.+)\/page\/(\d+)(\/index.pug)$/);

    if (!match) {
      return null;
    }

    const [, routeName, pageNum, routeFile] = match;
    const template = routeName + routeFile;

    const routePath = path.join(basedir, routeName, "page", pageNum, "index.pug");
    const templatePath = path.join(basedir, template);
    const relative = path.relative(path.dirname(routePath), templatePath)

    return {
      filePath: routePath,
      code: `- var pageNum = ${pageNum}\ninclude ${relative}`,
    };
  },
});
