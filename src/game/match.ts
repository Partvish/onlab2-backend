import { randomInt } from "crypto";
import Player from "../entities/player";
import MatchmakerMessages from "../matchmaking/matchmakermessages.enum";
import MatchMessages from "./matchmessages.enum";
import RoomMessages from "../matchmaking/roommessages.enum";
import PlayerAvatar from "./playerAvatar";

class Match {
  scores: Map<string, number> = new Map<string, number>();
  running: boolean = false;
  alivePlayerAvatars: PlayerAvatar[] = []
  playerAvatars: Map<string, PlayerAvatar> = new Map<string, PlayerAvatar>()

  notify: (message: string, data: any) => void;

  scorePointsToPlayers: (scores: Map<string, number>) => void;
  constructor(
    players: Player[],
    notify: (message: string, data: any) => void,
    givePointsToPlayers: (scores: Map<string, number>) => void
  ) {
    this.updatePlayers(players);
    this.notify = notify;
    this.scorePointsToPlayers = givePointsToPlayers;
  }

  updatePlayers(players: Player[]) {
    players.forEach((player) => {
      this.scores.set(player.id, 0)
      let avatar = <PlayerAvatar>{}
      avatar.id = player.id
      avatar.position = { x: 0, y: 0, z: 0 }
      avatar.rotation = { x: 0, y: 0, z: 0, w: 0 }
      avatar.velocity = { x: 0, y: 0, z: 0 }
      this.playerAvatars.set(player.id, avatar)
    }
    );
  }

  onStart() {
    this.running = true;
    this.notify(MatchMessages.UPDATE_MAP, this.alivePlayerAvatars);
  }


  onStop() {
    this.running = false;
    this.notify(RoomMessages.MATCH_STOPPING, null);
    this.scorePointsToPlayers(this.scores);
    this.alivePlayerAvatars = []
    this.playerAvatars.forEach((avatar: PlayerAvatar, key: string) => {
      avatar.position = { x: 0, y: 0, z: 0 }
      avatar.rotation = { x: 0, y: 0, z: 0, w: 0 }
      avatar.velocity = { x: 0, y: 0, z: 0 }
      this.alivePlayerAvatars.push(avatar)
    });
  }

  handleMove(avatar: PlayerAvatar) {
    this.playerAvatars.set(avatar.id, avatar)
  }

  registerHit(playerId: string, victimId: string) {
    let victimIndex = this.alivePlayerAvatars.findIndex(e=>e.id == victimId)
    if(victimIndex == -1)
      return
    console.log("victim found")
    let playerPoint = this.scores.get(playerId)
    console.log("scores found")
    this.alivePlayerAvatars.splice(victimIndex, 1)
    this.scores.set(playerId, (playerPoint || 0)+1)
    console.log("Hit registered from " + playerId + " to " + victimId)
    if(this.alivePlayerAvatars.length<2)
      this.onStop()
  }


  onPlayerLeave(playerId: string) {
    if (this.scores.size - 1 < 2) {
      this.onStop();
    }
  }
}

export default Match;
