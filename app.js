const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "*:*"
    }
});
var cron = require('node-cron');

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/dbmaaler.html')
});

app.use((req, res, next) => {
    const auth = {login: 'admin', password: 'admin'}

    // parse login and password from headers
    const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')

    // Verify login and password are set and correct
    if (login && password && login === auth.login && password === auth.password) {
        // Access granted...
        return next()
    }

    // Access denied...
    res.set('WWW-Authenticate', 'Basic realm="401"') // change this
    res.status(401).send('Authentication required.') // custom message
});

app.use(express.static('public'))



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
var maksDbs = new Map();
io.on('connection', (socket) => {
    socket.on('db', (msg) => {
        let simulertDbs = {}
        let id = Math.min(Math.max(1, msg.id), 7)
        let valgtLokasjon = lokasjoner[id - 1];
        simulertDbs.id = id;
        simulertDbs.lat = valgtLokasjon.lat;
        simulertDbs.lon = valgtLokasjon.lon;
        simulertDbs.db = msg.db * 1.5;

        sisteDbs.set(`id_${id}`, simulertDbs)
        io.emit('broadcast_dbs', simulertDbs)
        oppdaterMaksDb(simulertDbs);
    });

    socket.on('helloworld', (msg) => {
        if(msg === "asdf") {
            io.emit('helloworld_start', msg)
        } else {
            io.emit('helloworld_start', msg)
        }
    });

});

function oppdaterMaksDb(simulertDbs) {
    if(maksDbs.has(simulertDbs.id)) {
        let db = maksDbs.get(simulertDbs.id).db;
        if(db < simulertDbs.db) {
            maksDbs.set(simulertDbs.id, simulertDbs);
        }
    } else {
        maksDbs.set(simulertDbs.id, simulertDbs);
    }
}

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

cron.schedule('*/5 * * * * *', () => {
    Array.from(maksDbs.values()).forEach(function (it) {
        io.emit('broadcast_maks_verdier', it)
    })
});

cron.schedule('* */60 * * * *', () => {
    maksDbs = new Map();
    console.log("clearing")
});

server.listen(3000, () => {
    console.log('listening on *:3000')
});