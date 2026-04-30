const cacheKeys = {
  user: (id) => `user:${id}`,
  post: (postId) => `post:${postId}`,
  postComments: (postId) => `post:${postId}:comments`,
  userFollowers: (id) => `user:${id}:followers`,
};

module.exports = cacheKeys;