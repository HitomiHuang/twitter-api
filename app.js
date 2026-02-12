const path = require('path')
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const express = require('express')
const http = require('http')
const methodOverride = require('method-override')
const passport = require('./config/passport')
const routes = require('./routes')
const cors = require('cors')
const { initializeSocket } = require('./config/socket')

const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 3000

// 初始化 Socket.IO
initializeSocket(server)

app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(passport.initialize())

app.use(methodOverride('_method'))
app.use('/upload', express.static(path.join(__dirname, 'upload')))
app.use('/api', routes)

server.listen(port, () => console.log(`App listening on port ${port}!`))

module.exports = app
