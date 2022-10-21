require('dotenv').config()
const app = require('express')();
const http = require('http');

const server = {
  logEnable: true,
  io: null,
  users: [],
  httpServer: null,
  startHttpServer() {
    this.httpServer = http.createServer(app);
    app.get('/', (req, res) => {
      res.send('asd');
    });
    const port = process.env.port ? process.env.port : 3000;
    this.httpServer.listen(port, () => {
      this.log('listening on *:'+port);
    });
  },
  async start() {
    await this.startHttpServer();
    this.io = require("socket.io")(this.httpServer, {
      cors: {
        origin: "*",
        methods: ["*"],
        allowedHeaders: ["*"],
        credentials: false
      }
    });
    this.log('io started')
    this.io.disconnectSockets();
    this.log('disconnected Sockets')
    this.onConnected();
  },
  onConnected() {
    this.log('watch connections\n')
    this.io.on('connection', (socket) => {
      this.onDisconnect(socket);
      this.requestUserDetails(socket);
      this.onMessage(socket);
    });
  },
  onDisconnect(socket) {
    socket.on('disconnect', () => {
      this.users = this.users.filter(x => x.id !== socket.id);
      this.log({users: this.users})
      this.updateUserList();
    })
  },
  requestUserDetails(socket) {
    socket.emit("require-user-details", "");
    socket.on('add-user', (userDetails) => {
      if (!this.users.includes(userDetails.name)) {
        this.users.push({id: socket.id, name: userDetails.name})
        this.updateUserList();
      }
    })
  },
  updateUserList() {
    this.io.emit('user-list-update', this.users);
    this.log({users: this.users})
  },
  onMessage(socket) {
    socket.on('message', (res) => {
      this.log({type: 'message', text: res});
      const socketUser = this.users.filter(x => x.id === socket.id)[0];
      this.io.emit('message', {username: socketUser.username, text: res});
    })
  },
  log(title = '', text = '') {
    if (this.logEnable) {
      console.log(title, text);
    }
  }
}

server.start();