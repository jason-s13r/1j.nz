import { Resolver } from "@parcel/plugin";
import path from "node:path";
import fs from "node:fs";

export default new Resolver({
  async resolve(opts) {
    const { specifier } = opts;
    const basedir = path.join(__dirname, "..", "..", "..");

    const match = specifier.match(
      /^(.+)\/tags\/([a-z0-9\-]+)(\/page\/(\d+))?\/index.pug$/,
    );

    if (!match && !specifier.endsWith("/tags/index.pug")) {
      return null;
    }

    if (!match) {
      return tagsList(basedir, specifier);
    }

    const [, routeName, tagSlug, , routePageNum] = match;
    return taggedPostList(basedir, routeName, tagSlug, routePageNum, specifier);
  },
});

function tagsList(basedir: string, specifier: string) {
  const [postRoot] = specifier.split('/tags/index.pug', 1);
  const routePath = path.join(basedir, specifier);
  const templatePath = path.join(basedir, "src/layout/pug/_tags-list.pug");
  const relative = path.relative(path.dirname(routePath), templatePath);
  return {
    filePath: routePath,
    code: `
- var posts = getPosts("${postRoot}")
- var tempTags = posts.flatMap(post => post.tags.toSorted((a, b) => a.name.localeCompare(b.name)))
- var tagMap = new Map(tempTags.map(tag => [tag.route, tag]))
- var tagCounts = tempTags.reduce((acc, tag) => ({...acc, [tag.route]: (acc[tag.route] || 0) + 1}), {})
- var tags = tagMap.values().toArray().map((tag) => ({...tag, count: tagCounts[tag.route]}))
include ${relative}`,
  };
}

function taggedPostList(
  basedir: string,
  routeName: string,
  tagSlug: string,
  routePageNum: string,
  specifier: string,
) {
  const pageNum = +(routePageNum ?? 1) || 1;

  const pagedRoute = path.join(basedir, routeName, "tags", tagSlug, "page", pageNum.toString(), "index.pug");
  const baseRoute = path.join(basedir, routeName, "tags", tagSlug, "index.pug");
  const routePath = pageNum > 1 ? pagedRoute : baseRoute;
  const templatePath = path.join(basedir, "src/layout/pug/_tag-posts.pug");
  const relative = path.relative(path.dirname(routePath), templatePath);

  return {
    filePath: routePath,
    code: `
- var postRoot = '${routeName}'
- var tagSlug = '${tagSlug}'
- var pageNum = ${pageNum}
include ${relative}
`,
  };
}
