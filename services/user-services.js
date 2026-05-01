const bcrypt = require('bcryptjs')
const { User, Tweet, Reply, Like, Followship, Notification } = require('../models')
const helpers = require('../_helpers')
const jwt = require('jsonwebtoken')
const JWTSECRET = process.env.JWT_SECRET || 'alphacamp'
const Sequelize = require('sequelize')
const { sendNotification } = require('../utils/socketNotifier')

const userServices = {
  signUp: (req, cb) => {
    let { account, name, email, password, checkPassword } = req.body
    if (!account || !password || !checkPassword || !email || !name) throw new Error('Please fill required fields!')

    account = account.trim()
    name = name.trim()
    email = email.trim()
    password = password.trim()
    checkPassword = checkPassword.trim()

    if (password != checkPassword) throw new Error('Password do not match!')
    if (name.length > 50) throw new Error('Length of the name is too long!')

    return Promise.all([
      User.findOne({ where: { account } }),
      User.findOne({ where: { email } })
    ])
      .then(([accountCheck, emailCheck]) => {
        if (accountCheck) throw new Error('Account already exists!')
        if (emailCheck) throw new Error('Email already exists!')
        return bcrypt.hash(password, 10)
      })
      .then(hash => User.create({
        account,
        name,
        email,
        password: hash
      }))
      .then(createdUser => cb(null, { createdUser }))
      .catch(err => cb(err))
  },
  getUser: async (req, cb) => {
    try {
      const userId = req.params.id;

      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        include: [
          { model: User, as: 'Followers' },
          { model: User, as: 'Followings' }
        ]
      });

      if (!user) throw new Error("User didn't exists!");

      // 取得當前登入用戶的追蹤清單
      const currentUser = await User.findByPk(helpers.getUser(req).id, {
        include: [{ model: User, as: 'Followings' }]
      });

      // 檢查當前用戶是否已追蹤此用戶，並獲取通知設定
      let notificationEnabled = false;
      const followship = await Followship.findOne({
        where: {
          followerId: helpers.getUser(req).id,
          followingId: userId
        }
      });

      if (followship) {
        notificationEnabled = followship.notificationEnabled !== false; // 預設為 true
      }

      const data = user.toJSON();
      data.Followers = data.Followers.length;
      data.Followings = data.Followings.length;
      data.isFollowed = currentUser ? currentUser.Followings.some(f => f.id === data.id) : false;
      data.notificationEnabled = notificationEnabled;

      return cb(null, data);
    } catch (err) {
      cb(err);
    }
  },
  getUserTweets: (req, cb) => {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    return Promise.all([
      User.findByPk(req.params.id, { raw: true }),
      Tweet.findAll(
        {
          where: { UserId: req.params.id },
          include: [{ model: User, attributes: ['id', 'name', 'account', 'avatar'] }, { model: Reply }, { model: Like }],
          order: [['createdAt', 'DESC']],
          limit,
          offset
        })
    ])
      .then(([user, tweets]) => {
        if (!user) throw new Error("User didn't exists!")
        const tweetsData = tweets.map(t => ({
          ...t.toJSON(),
          Replies: t.Replies.length,
          Likes: t.Likes.length,
          isLiked: t.Likes.some(l => l.UserId === helpers.getUser(req).id)
        }))
        return cb(null, tweetsData)
      })
      .catch(err => cb(err))
  },
  getUserRepliedTweets: (req, cb) => {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    return Promise.all([
      User.findByPk(req.params.id, { raw: true }),
      Reply.findAll({
        where: { UserId: req.params.id },
        include: [
          { model: Tweet, include: [{ model: User, attributes: ['id', 'name', 'account', 'avatar'] }] },
          { model: User, attributes: ['id', 'name', 'account', 'avatar'] }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      })
    ])
      .then(([user, replies]) => {
        if (!user) throw new Error("User didn't exists!")
        const repliedTweets = replies.map(r => ({
          ...r.toJSON(),
          comment: r.comment
        }))
        return cb(null, repliedTweets)
      })
      .catch(err => cb(err))

  },
  getUserLikes: (req, cb) => {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    return Promise.all([
      User.findByPk(req.params.id, { raw: true }),
      Like.findAll({
        where: { UserId: req.params.id },
        include: [{ model: Tweet, include: [{ model: User, attributes: ['id', 'name', 'account', 'avatar'] }, { model: Reply }, { model: Like }] }],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      })
    ])
      .then(([user, likes]) => {
        if (!user) throw new Error("User didn't exists!")
        const userLikes = likes.map(l => ({
          ...l.toJSON(),
          tweetLikesCount: l.Tweet.Likes.length,
          tweetRepliesCount: l.Tweet.Replies.length,
          isLiked: l.Tweet.Likes.some(like => like.UserId === helpers.getUser(req).id)
        }))
        return cb(null, userLikes)
      })
      .catch(err => cb(err))
  },
  getUserFollowings: (req, cb) => {
    return User.findByPk(req.params.id, {
      include: [
        { model: User, as: 'Followings' }
      ]
    })
      .then((user) => {
        if (!user) throw new Error("User didn't exists!")

        const userFollowings = user.Followings.map(f => ({
          followingId: f.id,
          followingName: f.name,
          followingAccount: f.account,
          followingAvatar: f.avatar,
          followingIntroduction: f.introduction,
          isFollowed: helpers.getUser(req).Followings.some(follow => follow.id === f.id),
          createdAt: f.Followship.createdAt
        }))
          .sort((a, b) => b.createdAt - a.createdAt)
        return cb(null, userFollowings)
      })
      .catch(err => cb(err))
  },
  getUserFollowers: (req, cb) => {
    return User.findByPk(req.params.id, {
      include: [
        { model: User, as: 'Followers' }
      ]
    })

      .then((user) => {
        if (!user) throw new Error("User didn't exists!")
        const userFollowers = user.Followers.map(f => ({
          followerId: f.id,
          followerName: f.name,
          followerAccount: f.account,
          followerAvatar: f.avatar,
          followerIntroduction: f.introduction,
          isFollowed: helpers.getUser(req).Followings.some(follow => follow.id === f.id),
          createdAt: f.Followship.createdAt
        }))
          .sort((a, b) => b.createdAt - a.createdAt)
        return cb(null, userFollowers)
      })
      .catch(err => cb(err))
  },
  putUser: (req, cb) => {
    let { account, name, email, password, checkPassword, introduction } = req.body
    let avatar = null
    let cover = null

    if (account) {
      account = account.trim()
    }
    if (email) {
      email = email.trim()
    }
    if (name) {
      name = name.trim()
      if (name.length > 50) throw new Error('Length of the name is too long!')
    }
    if (password) {
      password = password.trim()
      if (!checkPassword) throw new Error('Please enter checkPassword!')
    }
    if (checkPassword) {
      checkPassword = checkPassword.trim()
      if (password != checkPassword) throw new Error('Password do not match!')
    }
    if (introduction) {
      introduction = introduction.trim()
      if (introduction.length > 160) throw new Error('Length of the introduction is too long!')
    }
    if (req.files) {
      if (req.files['avatar']) {
        avatar = req.files['avatar'][0]
      }
      if (req.files['cover']) {
        cover = req.files['cover'][0]
      }
    }
    return Promise.all([
      User.findByPk(req.params.id),
      helpers.imgurFileHandler(avatar),
      helpers.imgurFileHandler(cover)
    ])
      .then(async ([user, avatarImg, coverImg]) => {
        if (!user) throw new Error("User didn't exists!")
        if (account && account !== user.account) {
          if (await User.findOne({ where: { account } })) throw new Error("Account Exists!")
        }
        if (email && email !== user.email) {
          if (await User.findOne({ where: { email } })) throw new Error("Email Exists!")
        }
        if (password) {
          password = await bcrypt.hash(password, 10)
        }
        return user.update({
          name: name || user.name,
          account: account || user.account,
          email: email || user.email,
          password: password || user.password,
          introduction: introduction || user.introduction,
          avatar: avatarImg || user.avatar,
          cover: coverImg || user.cover
        })
      })
      .then(putUser => {
        const editUser = putUser.toJSON()
        delete editUser.password
        const token = jwt.sign(editUser, JWTSECRET, { expiresIn: '30d' })
        return cb(null, { status: 'success', token, editUser })
      })
      .catch(err => cb(err))
  },
  addFollowing: (req, cb) => {
    let createdFollowship = null;
    const followingId = req.body.id;

    return Promise.all([
      User.findByPk(followingId),
      Followship.findOne({
        where: {
          followerId: helpers.getUser(req).id,
          followingId: followingId
        }
      })
    ])
      .then(([user, followship]) => {
        if (!user) throw new Error("User didn't exist!")
        if (followship) throw new Error('You are already following this user!')
        return Followship.create({
          followerId: helpers.getUser(req).id,
          followingId: followingId,
          notificationEnabled: true
        })
      })
      .then(followship => {
        createdFollowship = followship;
        // 創建追蹤通知給被追蹤的用戶
        return Notification.create({
          recipientId: followingId,
          senderId: helpers.getUser(req).id,
          type: 'new_follower',
          tweetId: null,
          replyId: null,
          isRead: false
        });
      })
      .then(notification => {
        // 發送即時通知
        sendNotification(followingId, notification);
        return cb(null, createdFollowship);
      })
      .catch(err => cb(err))
  },
  removeFollowing: (req, cb) => {
    Followship.findOne({
      where: {
        followerId: helpers.getUser(req).id,
        followingId: req.params.followingId
      }
    })
      .then(followship => {
        if (!followship) throw new Error("You haven't followed this user!")
        return followship.destroy()
      })
      .then(removefollowship => cb(null, removefollowship))
      .catch(err => cb(err))
  },
  getTopUsers: (req, cb) => {
    return User.findAll({
      attributes: ['id', 'name', 'account', 'avatar'],
      include: [{ model: User, as: 'Followers', attributes: ['id', 'name', 'account', 'avatar'] }],
      limit: 10
    })
      .then(users => {
        const result = users.map(user => ({
          ...user.toJSON(),
          followerCount: user.Followers.length,
          isFollowed: helpers.getUser(req).Followings.some(f => f.id === user.id)
        }))
          .sort((a, b) => b.followerCount - a.followerCount)
        return cb(null, result)
      })
      .catch(err => cb(err))
  },
  toggleNotification: (req, cb) => {
    const { notificationEnabled } = req.body;
    const followingId = req.params.followingId;
    const followerId = helpers.getUser(req).id;

    return Followship.findOne({
      where: {
        followerId,
        followingId
      }
    })
      .then(followship => {
        if (!followship) throw new Error("You haven't followed this user!");
        return followship.update({ notificationEnabled });
      })
      .then(updatedFollowship => cb(null, {
        status: 'success',
        notificationEnabled: updatedFollowship.notificationEnabled
      }))
      .catch(err => cb(err));
  }
}
module.exports = userServices