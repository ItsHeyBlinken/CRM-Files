import type { Server as SocketIOServer } from 'socket.io'

let io: SocketIOServer | null = null

export function initRealtimeNotifications(server: SocketIOServer): void {
  io = server
}

export function emitVendorRealtimeEvent(
  vendorId: number,
  event: string,
  data: unknown
): void {
  io?.to(`user_${vendorId}`).emit(event, data)
}
