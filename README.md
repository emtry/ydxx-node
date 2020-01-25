# ydxx-node
《云顶修仙》Node.js挂机脚本

浏览器版本地址：http://yundingxx.com:3344

### 生产环境

- Node.js v12.14.1
- npm v6.13.4

### 下载

[ydxx_0.js](https://github.com/emtry/ydxx-node/blob/master/ydxx_0.js)

### 功能

- ✅自动刷副本
- ✅体力小于10000自动吃红药水
- ✅自动重连
- ✅自动日常副本
- 加入指定用户队伍
- 自动上架物品

### 初始化

```bash
# 环境安装
npm install request socket.io-client async

# 修改账号 user_name｜密码 user_pwd｜频道 Channel｜副本id teamScenesId

# run
node ydxx_0.js
