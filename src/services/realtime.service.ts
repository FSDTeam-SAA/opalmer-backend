import { Server } from 'socket.io';
let current: Server | undefined;
export const initRealtime = (io: Server) => { current = io; };
export const emitToRoom = (room: string, event: string, data: unknown) => { current?.to(room).emit(event, data); };
export const emitToRoomMembers = (room: string, userIds: string[], event: string, data: unknown) => {
  current?.to([room, ...userIds.map(id => `user:${id}`)]).emit(event, data);
};
export const disconnectUser = (userId: string) => { current?.in(`user:${userId}`).disconnectSockets(true); };
