import Player from "../entities/player";
import Room from "./room";
import { Socket, Server } from "socket.io";
import { Server as HttpServer } from "http";
import UserService from "../auth/user.service";
import MatchmakerDto from "./matchmaker.dto";
import MatchmakerMessages from "./matchmakermessages.enum";
import { randomInt } from "crypto";
import findFreePorts from "find-free-ports";
import tcpPortUsed from "tcp-port-used";
import { AppDataSource } from "../database";
import User from "../auth/user";

class MatchmakerService {
  rooms: Room[] = [];
  userTickets: Map<string, number> = new Map<string, number>();
  sockets: Map<string, Socket> = new Map<string, Socket>();
  userService: UserService = new UserService();
  io: Server;
  repository = AppDataSource.getRepository(User);
  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "OPTIONS", "DELETE", "PUT"],
      },
    });

    this.io.on("connection", (socket: Socket) => {
      console.log("User connected");
      socket.on(MatchmakerMessages.REQUEST, (msg: MatchmakerDto) => {
        if (!msg || !msg.id) return;
        console.log(
          "Request for matchmaking has been announced from player " +
            msg.id +
            " and socket id " +
            socket.id
        );
        if (this.userTicketExists(msg.id)) {
          console.log("User Ticket exists");
          return;
        }
        if (this.userService.checkIfUserExists(msg.id)) {
          this.sockets.set(socket.id, socket);
          this.createUserTicket(msg.id, socket.id);
        }
      });
      socket.on("disconnect", () => {
        console.log("User disconnected");
        this.closeUserTicket(socket.id);
      });
    });
  }

  createUserTicket(userId: number, socketId: string) {
    this.userTickets.set(socketId, userId);
    this.run();
  }

  closeUserTicket(socketId: string) {
    this.userTickets.delete(socketId);
    this.userTickets.forEach((value, a) => console.log("a " + value));
  }

  userTicketExists(id: number) {
    for (var ticket of this.userTickets.values()) if (ticket == id) return true;
    return false;
  }

  async createRoom() {
    var port: number = randomInt(50500, 51500);
    let room;
    while (
      !this.rooms.every((e) => e.port != port) &&
      !tcpPortUsed.check(port, "localhost")
    ) {
      port = randomInt(50500, 51500);
    }
    this.rooms.push(new Room(port));
    return this.rooms[this.rooms.length - 1];
    /*const port = await findFreePorts(1, { startPort: 60000 });
    let room;

    room = new Room(port);
    this.rooms.push(room);
    return this.rooms[this.rooms.length - 1];*/
  }

  async addPlayerToRoom(room: Room, userId: number, socketId: string) {
    let user = await this.repository.findOneBy({ id: userId });
    let username = user && user.name ? user.name : "";
    let player_id = room.addPlayer(userId, username);
    const socket = this.sockets.get(socketId);
    if (socket != null) {
      socket.emit(MatchmakerMessages.MATCH_FOUND, {
        id: player_id,
        port: room.port,
      });
      socket.disconnect();
      this.sockets.delete(socketId);
    }
    this.closeUserTicket(socketId);
  }

  async run() {
    if (this.userTickets.size < 1) return;
    let room_index = this.rooms.findIndex((value: Room, index: number) =>
      value.canPlayerJoin()
    );
    let room: Room =
      room_index != -1 ? this.rooms[room_index] : await this.createRoom();
    this.userTickets.forEach(async (userId, socketId) => {
      if (room.canPlayerJoin()) {
        await this.addPlayerToRoom(room, userId, socketId);
      }
    });
  }
}

export default MatchmakerService;
