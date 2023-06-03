import Match from "../game/match";
import Player from "../entities/player";
import io, { Server, Socket } from "socket.io";
import { randomUUID } from "crypto";
import RoomMessages from "./roommessages.enum";
import { createServer, IncomingMessage, ServerResponse } from "http";
import express, { Request, Response } from "express";
import cors from "cors";
import MatchMessages from "../game/matchmessages.enum";
import PlayerAvatar from "../game/playerAvatar";

class Room {
  match: Match;
  maxPlayers: number = 4;
  players: Map<string, Player> = new Map<string, Player>();
  playersToJoin: Player[] = [];
  port: number;
  io: Server;
  sockets: Map<string, Socket> = new Map<string, Socket>();
  timer: NodeJS.Timer | null = null

  constructor(port: number) {
    this.port = port;
    console.log(`room created with port ${port}`);
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      res.end(`Room with port ${port}`);
    });
    //server.use(cors());
    /* server.get("/", (req: Request, res: Response) => {
      res.send(`Room with port: ${port}`);
    });*/
    //server.once()
    /*const listener = server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });*/
    this.io = new io.Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });


    this.io.on("connection", (socket: Socket) => {
      console.log("New player joined on port: " + this.port);
      this.sockets.set(socket.id, socket);
      socket.on(RoomMessages.REGISTER_PLAYER, (data) => {
        console.log("New player registered with id: " + data.id || "");
        if (data.id) {
          let player_index = this.getPlayerIdToRegister(data.id);
          if (player_index != -1) {
            this.onPlayerJoin(player_index, socket.id);
            this.io.emit(RoomMessages.UPDATE_ROOM_STATE, this.getRoomState());
            return;
          }
        } else socket.disconnect();
      });

      socket.on(RoomMessages.READY_PLAYER, () => {
        if (!this.players.has(socket.id)) return;
        let player = this.players.get(socket.id);
        if (!player) return;
        player.ready = true;
        this.players.set(socket.id, player);
        this.io.emit(RoomMessages.UPDATE_ROOM_STATE, this.getRoomState());
        this.checkIfAllPlayersAreReady();
      });
      socket.on(RoomMessages.UNREADY_PLAYER, () => {
        if (!this.players.has(socket.id)) return;
        let player = this.players.get(socket.id);
        if (!player) return;
        player.ready = false;
        this.players.set(socket.id, player);
        this.io.emit(RoomMessages.UPDATE_ROOM_STATE, this.getRoomState());
      });
      socket.on(MatchMessages.MOVE, (data: PlayerAvatar) => {
        console.log("Move received on socket: " + socket.id);
        if (!data || !data.position || !data.rotation || !data.velocity || !data.id) {
          console.log("badRequest");
          return;
        }
        this.match.handleMove(data);
      });
      socket.on(MatchMessages.HIT,(data)=>{
        if(!data || !data.id || !data){
          console.log("badRequest");
          return;
        }
        let player = this.players.get(socket.id)
        if(!player)
          return
        console.log("Hit message from player " + player.id)
        this.match.registerHit(player.id, data.id)
      });
      socket.on("disconnect", () => {
        this.onPlayerLeave(socket.id);
        this.io.emit(RoomMessages.UPDATE_ROOM_STATE, this.getRoomState());
      });
    });

    this.io.listen(port);

    this.match = new Match(
      [],
      (message: string, data: any) => {
        this.io.emit(message, data);
      },
      (map: Map<string, number>) => {
        this.givePointsToPlayers(map, this.players);
      }
    );
  }

  getPlayerIdToRegister(player_id: string) {
    return this.playersToJoin.findIndex(
      (player: Player) => player.id == player_id
    );
  }

  Room(maxPlayers: number) {
    this.maxPlayers = maxPlayers;
  }

  addPlayer(userId: number, userName: string) {
    const player = new Player();
    player.id = randomUUID();
    player.name = userName;
    this.playersToJoin.push(player);
    return player.id;
  }

  canPlayerJoin(): boolean {
    return this.players.size < this.maxPlayers && !this.match.running;
  }

  onPlayerJoin(playerIndex: number, socketId: string) {
    let player: Player = this.playersToJoin.splice(playerIndex, 1)[0];
    this.players.set(socketId, player);
  }
  onPlayerLeave(socket_id: string) {
    if (this.match.running) {
      this.stopMatch();
    }
    let player = this.players.get(socket_id);
    if (player) {
      this.match.scores.delete(player.id);
      this.match.onPlayerLeave(player.id);
    }
    this.players.delete(socket_id);
    this.sockets.delete(socket_id);
  }

  getRoomState() {
    let roomState: Array<PlayerReadyStateDto> = [];
    this.players.forEach((player: Player, socket_id: string) => {
      roomState.push({
        name: player.name,
        ready: player.ready,
        id: player.id,
        points: player.points,
      });
    });
    console.log(this.players);
    return { players: roomState };
  }

  checkIfAllPlayersAreReady() {
    if (this.players.size < 2) return;
    let canStart = true;
    this.players.forEach((v, k) => {
      if (!v.ready) canStart = false;
    });
    if (canStart) this.startMatch();
  }

  startMatch() {
    this.match.updatePlayers(Array.from(this.players.values()));
    this.io.emit(RoomMessages.MATCH_STARTING);
    this.match.onStart();
    this.timer = setInterval(() =>{
      if(this.timer && !this.match.running){
        clearInterval(this.timer)
        this.stopMatch()
      }
      this.io.emit(MatchMessages.UPDATE_MAP, this.match.alivePlayerAvatars)
    }, 16)
  }



  restartMatch() { }

  countdown() {
    this.match.running;
  }

  stopMatch() { 
    this.players.forEach((player: Player, key: string)=>{
      player.ready = false
    })
  }

  givePointsToPlayers(
    scores: Map<string, number>,
    players: Map<string, Player>
  ) {
    let array = Array.from(players.values());
    scores.forEach((points: number, playerId: string) => {
      let player = array.find((e) => e.id == playerId);
      if (player) player.points += points;
    });
    this.io.emit(RoomMessages.UPDATE_ROOM_STATE, this.getRoomState());
  }
}

export default Room;
