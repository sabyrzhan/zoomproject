const express = require('express')
const session = require('express-session')
var bodyParser = require('body-parser')
var MongoDBStore = require('connect-mongodb-session')(session);
var store = new MongoDBStore({
    uri: 'mongodb://root:root@localhost:27017/zoom?authSource=admin',
    databaseName: 'zoom',
    collection: 'sessions'
});
store.on('error', function(error) {
    console.log(error);
});
const app = express()
const { v4: uuidv4 } = require('uuid')
app.set('view engine', 'ejs')
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { ExpressPeerServer } = require('peer')
const peerServer = ExpressPeerServer(server, {
    debug: true
})

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'keyboard cat',
    store: store,
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    },
}))

const users = {
    '1': {
        username: '1',
        password: 'password'
    },
    '2': {
        username: '2',
        password: 'password'
    }
}

app.use('/public', express.static('public'))
app.use('/peerjs', peerServer)

app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/new')
    } else {
        res.render('index')
    }
});

app.post('/register', (req, res) => {

})

app.post('/login', (req, res) => {
    const email = req.body.email
    if (users[email]) {
        req.session.userId = email
        res.redirect('/new')
    } else {
        res.redirect('/?error')
    }
})

app.get('/new', (req, res) => {
    res.redirect(`/${uuidv4()}`)
})

app.get('/test', (req, res) => {
    res.render('test')
})


app.get('/:roomId', (req, res) => {
    console.log(req.session.userId)
    res.render('room', {roomId: req.params.roomId, userId: req.session.userId})
});


io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        //users.push(userId);
        console.log(`joined room: ${roomId} with userId=${userId}`)
        socket.join(roomId)
        socket.to(roomId).broadcast.emit('user-connected', userId);

        socket.on('message', (message) => {
            io.to(roomId).emit('createMessage', message)
        })
    })
})

server.listen(80)