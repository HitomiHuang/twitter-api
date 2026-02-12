const passport = require('passport')
const LocalStrategy = require('passport-local')
const { Strategy: JWTStrategy, ExtractJwt: ExtractJWT } = require('passport-jwt')
const bcrypt = require('bcryptjs')
const { User } = require('../models')

// 將設定集中管理
const config = {
  jwt: {
    secret: process.env.JWT_SECRET || 'alphacamp',
    options: {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'alphacamp'
    }
  },
  local: {
    usernameField: 'account',
    passwordField: 'password'
  }
}

// 本地驗證策略
passport.use(new LocalStrategy(
  config.local,
  async (account, password, done) => {
    try {
      const user = await User.findOne({ where: { account } })

      if (!user) {
        return done(null, false, { message: "使用者不存在" })
      }

      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return done(null, false, { message: "帳號或密碼錯誤" })
      }

      return done(null, user)
    } catch (error) {
      return done(error)
    }
  }
))

// JWT 驗證策略
passport.use(new JWTStrategy(
  config.jwt.options,
  async (jwtPayload, done) => {
    try {
      const user = await User.findByPk(jwtPayload.id, {
        include: [
          { model: User, as: 'Followers' },
          { model: User, as: 'Followings' }
        ]
      })

      if (!user) {
        return done(null, false)
      }

      return done(null, user.toJSON())
    } catch (error) {
      return done(error)
    }
  }
))

module.exports = passport