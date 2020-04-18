import { json } from 'body-parser';
import cors from 'cors';
import express from 'express';
import http from 'http';
import Server from 'socket.io';
import { onNewCard, onSubscribe, onDisconnect } from './events';
import { nOfPlayersInRoom, Player } from './player';
import { Room } from './room';

const app = express();
const httpServer = new http.Server(app);
const io = Server(httpServer);

app.use(cors());
app.use(json());

// Game state
const rooms: Room[] = [];

// Routes
app.post('/join', (req, res) => {
  const { user, roomName } = req.body;
  const player: Player = user;
  let room = rooms.find((r) => r.name === roomName);

  // If room doesn't exist and is empty, create a new room
  if (room === undefined) {
    console.log('Creating new room', roomName);
    room = new Room(roomName);
    rooms.push(room);
  }

  const playersInRoom = nOfPlayersInRoom(roomName, io);

  // Check if the room is full
  if (playersInRoom > 7) {
    return res.status(400).send('Room is full');
  }

  // Add user to the room
  player.number = room.players.length + 1;
  room.addPlayer(player);

  res.status(200).send({
    player,
    cards: room.deck,
  });
});

// Socket
io.on('connect', (socket) => {
  console.log('Socket connected');

  // On subscribe
  socket.on('subscribe', (roomName: string) => {
    socket.join(roomName);

    const response = onSubscribe(roomName, rooms);

    io.to(roomName).emit('player-joined', response);
    console.log('player-joined emited with:', response);
  });

  // On new-card
  socket.on('new-card', (roomName) => {
    const response = onNewCard(roomName, rooms);

    io.to(roomName).emit('update', response);
    console.log('updated emited with:', response);
  });

  // On disconnect
  socket.on('disconnect', () => {
    const leftRooms = onDisconnect(socket, rooms);

    leftRooms.forEach((room) => {
      io.to(room.name).emit('player-left', room.players);
      console.log(`player-left emited for ${room}: ${room.players}`);
    });
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});