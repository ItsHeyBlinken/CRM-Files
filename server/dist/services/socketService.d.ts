import { Server as SocketIOServer } from 'socket.io';
export declare const socketHandler: (io: SocketIOServer) => {
    notifyUser: (userId: string, event: string, data: any) => void;
    notifyTeam: (teamId: string, event: string, data: any) => void;
    notifyDepartment: (department: string, event: string, data: any) => void;
    broadcast: (event: string, data: any) => void;
    getConnectedUsersCount: () => number;
    getConnectedUsers: () => string[];
};
//# sourceMappingURL=socketService.d.ts.map