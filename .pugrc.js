const postUtils = require("./src/core/pug/posts");
const pagingUtils = require("./src/core/pug/paging");

module.exports = {
  locals: {
    pageNum: 1,
    pageSize: 10,
    pagedList: pagingUtils.pagedList,
    withVariable: postUtils.withVariable,
    getPosts: postUtils.getPosts,
    getSinglePost: postUtils.getSinglePost,
  },
};
