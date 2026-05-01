'use strict'
const bcrypt = require('bcryptjs')
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Users', [{
      account: 'root',
      email: 'root@example.com',
      password: await bcrypt.hash('12345678', 10),
      name: '系統管理員',
      role: 'admin',
      avatar: 'https://i.pravatar.cc/320?img=3',
      cover: 'https://picsum.photos/seed/admin/900/300',
      introduction: '負責守護社群平台的穩定運作與秩序維護，若有帳號問題、內容申訴或技術回報，都歡迎透過私訊聯絡，我會盡快處理。平台的每一個使用者都值得被認真對待。',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      account: 'user1',
      email: 'user1@example.com',
      password: await bcrypt.hash('12345678', 10),
      name: '陳小明',
      role: 'user',
      avatar: 'https://i.pravatar.cc/320?img=11',
      cover: 'https://picsum.photos/seed/user1/900/300',
      introduction: '後端工程師，目前在新創公司寫 Node.js。喜歡喝咖啡、研究開源工具，週末偶爾打籃球放空。相信好的程式碼是最直接的溝通方式，也相信人生需要一點點的不完美才夠真實。',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      account: 'user2',
      email: 'user2@example.com',
      password: await bcrypt.hash('12345678', 10),
      name: '林雅婷',
      role: 'user',
      avatar: 'https://i.pravatar.cc/320?img=47',
      cover: 'https://picsum.photos/seed/user2/900/300',
      introduction: '攝影是我和這個世界對話的方式。喜歡在旅途中用鏡頭記錄細節，不管是一道光、一個眼神、還是一塊剝落的牆漆，每一張照片背後都有一個我想留住的瞬間。底片和數位都愛。',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      account: 'user3',
      email: 'user3@example.com',
      password: await bcrypt.hash('12345678', 10),
      name: '王志偉',
      role: 'user',
      avatar: 'https://i.pravatar.cc/320?img=59',
      cover: 'https://picsum.photos/seed/user3/900/300',
      introduction: '獨立音樂創作者，寫歌、編曲、自己錄音。偶爾在西門町或信義區街頭表演，用旋律記錄那些難以用語言說清楚的感受。新 EP 製作中，喜歡我的音樂可以追蹤，謝謝每一個停下來聽的人。',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      account: 'user4',
      email: 'user4@example.com',
      password: await bcrypt.hash('12345678', 10),
      name: '張佳蓉',
      role: 'user',
      avatar: 'https://i.pravatar.cc/320?img=32',
      cover: 'https://picsum.photos/seed/user4/900/300',
      introduction: '認證健身教練，專長肌力訓練與體態調整。相信運動不只是為了外表，更是一種對自己負責任的生活方式。歡迎想開始動起來的人來找我，不管起點在哪，我都可以幫你找到適合的節奏。',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      account: 'user5',
      email: 'user5@example.com',
      password: await bcrypt.hash('12345678', 10),
      name: '劉建宏',
      role: 'user',
      avatar: 'https://i.pravatar.cc/320?img=68',
      cover: 'https://picsum.photos/seed/user5/900/300',
      introduction: '全職美食部落客，專門挖掘台灣各地的隱藏版小吃與巷弄老店。不寫業配、只寫真實體驗，從台北夜市到台南老街，只要有值得的一碗，再遠都值得去一次。歡迎推薦私藏口袋名單給我。',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    ])
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {})
  }
}
