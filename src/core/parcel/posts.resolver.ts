import { Resolver } from "@parcel/plugin";
import path from "node:path";
import fs from "node:fs";

export default new Resolver({
  async resolve(opts) {
    const { specifier } = opts;
    const basedir = path.join(__dirname, "..", "..", "..");

    const match = specifier.match(/^(\/content\/[^/]+)\/.+\.md$/);


    if (!match) {
      return null;
    }

    const [, postRoot] = match;
    const routeName = specifier.replace(/(index)?\.md$/, '');
    const routePath = path.join(basedir, routeName, 'index.pug');
    const templatePath = path.join(basedir, "src/layout/pug/_single-post.pug");
    const relative = path.relative(path.dirname(routePath), templatePath);
    return {
      filePath: routePath,
      code: `
- var postRoot = '${postRoot}'
- var post = getSinglePost('${specifier}', '${postRoot}')
- var title = post.title
include ${relative}`,
    };
  },
});
