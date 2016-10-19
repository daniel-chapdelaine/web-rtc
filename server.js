'use strict'

let Hapi = require('hapi');
let server = new Hapi.Server()
server.connection({
  'host': 'localhost',
  'port': 3000
});
let socketio = require("socket.io");
let io = socketio(server.listener);
let twilio = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

// Serve static assets
server.route({
  method: 'GET',
  path: '/{path*}',
  handler: {
    directory: { path: './public', listing: false, index: true }
  }
});

io.on('connection', function(socket){

  socket.on('join', function(room){
    let clients = io.sockets.adapter.rooms[room];
    let numClients = (clients !== undefined) ? clients.length : 0;
    if(numClients == 0){
    	socket.join(room)
    }else if(numClients == 1){
      socket.join(room)
      socket.emit('ready', room);
      socket.broadcast.emit('ready', room);
    }else{
      socket.emit('full', room);
    }
  });

  socket.on('token', function(){
    twilio.tokens.create(function(err, response){
      if(err){
        console.log(err);
      }else{
        socket.emit('token', response);
      }
    });
  });

  socket.on('candidate', function(candidate){
    socket.broadcast.emit('candidate', candidate);
  });

  socket.on('offer', function(offer){
    socket.broadcast.emit('offer', offer);
  });

  socket.on('answer', function(answer){
    socket.broadcast.emit('answer', answer);
  });
});
// Start the server
server.start(() =>{
  console.log('Server running at:', server.info.uri);
});
