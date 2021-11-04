const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);

app.use(express.static('public'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/dbmaaler.html');
});

io.on('connection', (socket) => {
    socket.on('db', (msg) => {
        console.log(msg);
        io.emit('broadcast_dbs', msg);
    });
});

app.get('/api/iot/:id/:db', function (req, res) {
    console.log(`Sendte: ${req.params.id} ${req.params.db}`)
    io.emit('broadcast_iot_api', `Sendte: ${req.params.id} ${req.params.db}`);
    res.send(`Sendte: ${req.params.id} ${req.params.db}`)
});


server.listen(3000, () => {
    console.log('listening on *:3000');
});