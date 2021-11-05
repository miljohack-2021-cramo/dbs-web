const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);
var cron = require('node-cron');

app.use(express.static('public'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/dbmaaler.html')
});

let lokasjoner = [
    {lat: '59.91462', lon: '10.78737'},
    {lat: '59.9156', lon: '10.78606'},
    {lat: '59.91636', lon: '10.78439'},
    {lat: '59.91648', lon: '10.78242'},
    {lat: '59.9155', lon: '10.78333'},
    {lat: '59.91461', lon: '10.78525'},
    {lat: '59.91415', lon: '10.78674'}
]

var sisteDbs = new Map();
io.on('connection', (socket) => {
    socket.on('db', (msg) => {
        let simulertDbs = {}
        let id = Math.min(Math.max(1, msg.id), 7)
        let valgtLokasjon = lokasjoner[id - 1];
        simulertDbs.id = id;
        simulertDbs.lat = valgtLokasjon.lat;
        simulertDbs.lon = valgtLokasjon.lon;
        simulertDbs.db = msg.db;

        sisteDbs.set(`id_${id}`, simulertDbs)
        io.emit('broadcast_dbs', simulertDbs)
    });
});

app.get('/api/iot/:id/:db', function (req, res) {
    console.log(`Sendte: ${req.params.id} ${req.params.db}`)
    io.emit('broadcast_iot_api', `Sendte: ${req.params.id} ${req.params.db}`)
    res.send(`Sendte: ${req.params.id} ${req.params.db}`)
});


cron.schedule('*/1 * * * * *', () => {
    Array.from(sisteDbs.values()).forEach(function (it) {
        io.emit('broadcast_siste_verdier', it)
    })
    sisteDbs = new Map();
});

server.listen(3000, () => {
    console.log('listening on *:3000')
});