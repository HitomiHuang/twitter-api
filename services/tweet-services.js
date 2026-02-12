const { Tweet, Like, User, Reply, Notification, Followship } = require('../models')
const helpers = require('../_helpers')
const { sendNotification } = require('../utils/socketNotifier')

const tweetController = {
  addLike: (req, cb) => {
    let createdLike = null;
    let tweetAuthorId = null;

    return Promise.all([
      Tweet.findByPk(req.params.id),
      Like.findOne({
        where: {
          UserId: helpers.getUser(req).id,
          TweetId: req.params.id
        }
      })
    ])
      .then(([tweet, like]) => {
        if (!tweet) throw new Error("Tweet didn't exist!")
        if (like) throw new Error('You have Like this Tweet')

        tweetAuthorId = tweet.UserId;

        return Like.create({
          UserId: helpers.getUser(req).id,
          TweetId: req.params.id
        })
      })
      .then(like => {
        createdLike = like;
        // 檢查是否需要創建通知：不是點讚自己的貼文
        if (tweetAuthorId !== helpers.getUser(req).id) {
          return Followship.findOne({
            where: {
              followerId: tweetAuthorId,
              followingId: helpers.getUser(req).id
            }
          });
        }
        return null;
      })
      .then(followship => {
        // 如果不是點讚自己的貼文，創建通知
        if (tweetAuthorId !== helpers.getUser(req).id) {
          const shouldNotify = !followship || followship.notificationEnabled !== false;

          if (shouldNotify) {
            return Notification.create({
              recipientId: tweetAuthorId,
              senderId: helpers.getUser(req).id,
              type: 'new_like',
              tweetId: req.params.id,
              replyId: null,
              isRead: false
            }).then(notification => {
              // 發送即時通知
              sendNotification(tweetAuthorId, notification);
              return notification;
            });
          }
        }
        return null;
      })
      .then(() => cb(null, createdLike))
      .catch(err => cb(err))
  },
  removeLike: (req, cb) => {
    return Like.findOne({
      where: {
        UserId: helpers.getUser(req).id,
        TweetId: req.params.id
      }
    })
      .then(like => {
        if (!like) throw new Error("You haven't like this tweet")

        return like.destroy()
      })
      .then(removelike => cb(null, removelike))
      .catch(err => cb(err))
  },
  postTweet: (req, cb) => {
    let { description } = req.body
    const UserId = helpers.getUser(req).id
    description = description.trim()
    if (!description) throw new Error('tweet description is required!')
    if (description.length > 140) throw new Error('Length of the name is too long!')
    return User.findByPk(UserId)
      .then(user => {
        if (!user) throw new Error("User didn't exist!")
        return Tweet.create({
          description,
          UserId
        })
      })
      .then(newtweet => cb(null, newtweet))
      .catch(err => cb(err))
  },
  getTweets: (req, cb) => {
    const currentUser = helpers.getUser(req);

    return Tweet.findAll({
      order: [['createdAt', 'DESC']],
      include: [Like, Reply, User]
    })
      .then(tweet => {
        const likeCount = tweet.map(r => ({
          ...r.toJSON(),
          description: r.description.substring(0, 50),
          Likes: r.Likes.length ? r.Likes.length : 0,
          Replies: r.Replies.length ? r.Replies.length : 0,
          isLiked: currentUser ? r.Likes.some(like => like.UserId === currentUser.id) : false
        }))
        return cb(null, likeCount)
      })
      .catch(err => cb(err))
  },
  getTweet: (req, cb) => {
    const currentUser = helpers.getUser(req);

    return Tweet.findByPk(req.params.tweet_id, {
      include: [
        Like,
        Reply,
        User
      ]
    })
      .then(tweet => {
        if (!tweet) throw new Error("Tweet didn't exist!")
        const Data = tweet.toJSON()
        Data.Likes = Data.Likes.length,
          Data.Replies = Data.Replies.length
        Data.isLiked = currentUser ? tweet.Likes.some(l => l && l.UserId === currentUser.id) : false
        return cb(null, Data)
      })
      .catch(err => cb(err))
  },
  addReply: (req, cb) => {
    const comment = req.body.comment.trim()
    if (!comment) throw new Error("Please enter you reply!")

    let createdReply = null;
    let tweetAuthorId = null;

    return Tweet.findByPk(req.params.tweet_id, { raw: true })
      .then(tweet => {
        if (!tweet) throw new Error("Tweet didn't exist!")
        tweetAuthorId = tweet.UserId;
        return Reply.create({
          UserId: helpers.getUser(req).id,
          TweetId: req.params.tweet_id,
          comment
        })
      })
      .then(reply => {
        createdReply = reply;
        // 檢查是否需要創建通知：不是回覆自己的貼文
        if (tweetAuthorId !== helpers.getUser(req).id) {
          // 檢查貼文作者是否追蹤回覆者，並且開啟了通知
          return Followship.findOne({
            where: {
              followerId: tweetAuthorId,
              followingId: helpers.getUser(req).id
            }
          });
        }
        return null;
      })
      .then(followship => {
        // 如果貼文作者追蹤回覆者且開啟通知，或者不管是否追蹤都要通知（根據需求調整）
        // 這裡我們假設：只要不是自己回覆自己，就創建通知
        if (tweetAuthorId !== helpers.getUser(req).id) {
          // 只有在開啟通知時才創建（如果有追蹤關係）
          // 如果沒有追蹤關係，也創建通知（因為別人回覆了你的貼文）
          const shouldNotify = !followship || followship.notificationEnabled !== false;

          if (shouldNotify) {
            return Notification.create({
              recipientId: tweetAuthorId,
              senderId: helpers.getUser(req).id,
              type: 'new_reply',
              tweetId: req.params.tweet_id,
              replyId: createdReply.id,
              isRead: false
            }).then(notification => {
              // 發送即時通知
              sendNotification(tweetAuthorId, notification);
              return notification;
            });
          }
        }
        return null;
      })
      .then(() => cb(null, createdReply))
      .catch(err => cb(err))
  },
  viewReplies: (req, cb) => {
    return Promise.all([
      Tweet.findByPk(req.params.tweet_id),
      Reply.findAll({
        where: { TweetId: req.params.tweet_id },
        include: [{ model: Tweet, include: User }, { model: User }],
        order: [['createdAt', 'DESC']]
      })
    ])
      .then(([tweet, replies]) => {
        if (!tweet) throw new Error("Tweet didn't exist!")
        const repliesData = replies.map(r => ({
          ...r.toJSON(),
          userAccount: r.User.account,
          userName: r.User.name,
          userAvatar: r.User.avatar,
          replyUserId: r.Tweet.User.id,
          replyUserAccount: r.Tweet.User.account,
          replyUserName: r.Tweet.User.name,
          User,
          Tweet
        }))

        return cb(null, repliesData)
      })
      .catch(err => cb(err))
  }
}

module.exports = tweetController