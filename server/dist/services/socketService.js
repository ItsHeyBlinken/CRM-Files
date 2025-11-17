"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketHandler = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
const connectedUsers = new Map();
const socketHandler = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth['token'] || socket.handshake.headers.authorization?.split(' ')[1];
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env['JWT_SECRET']);
            const user = await User_1.User.findById(decoded.id);
            if (!user || !user.isActive) {
                return next(new Error('Authentication error: Invalid user'));
            }
            socket.user = user;
            next();
        }
        catch (error) {
            logger_1.logger.error('Socket authentication error:', error);
            next(new Error('Authentication error: Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        if (!socket.user) {
            logger_1.logger.error('Socket connected without user');
            return;
        }
        const userId = socket.user.id;
        const userName = User_1.User.getFullName(socket.user);
        logger_1.logger.info(`User ${userName} (${userId}) connected via socket`);
        connectedUsers.set(userId, socket.id);
        socket.join(`user_${userId}`);
        if (socket.user.company) {
            socket.join(`company_${socket.user.company}`);
        }
        socket.broadcast.emit('user:online', {
            userId,
            userName,
            timestamp: new Date(),
        });
        socket.on('join:room', (roomId) => {
            socket.join(roomId);
            logger_1.logger.info(`User ${userName} joined room: ${roomId}`);
        });
        socket.on('leave:room', (roomId) => {
            socket.leave(roomId);
            logger_1.logger.info(`User ${userName} left room: ${roomId}`);
        });
        socket.on('activity:create', (activityData) => {
            socket.broadcast.emit('activity:new', {
                ...activityData,
                createdBy: {
                    id: userId,
                    name: userName,
                },
                timestamp: new Date(),
            });
        });
        socket.on('deal:update', (dealData) => {
            socket.broadcast.emit('deal:updated', {
                ...dealData,
                updatedBy: {
                    id: userId,
                    name: userName,
                },
                timestamp: new Date(),
            });
        });
        socket.on('lead:update', (leadData) => {
            socket.broadcast.emit('lead:updated', {
                ...leadData,
                updatedBy: {
                    id: userId,
                    name: userName,
                },
                timestamp: new Date(),
            });
        });
        socket.on('task:assign', (taskData) => {
            const assigneeId = taskData.assignedTo;
            if (assigneeId) {
                io.to(`user_${assigneeId}`).emit('task:assigned', {
                    ...taskData,
                    assignedBy: {
                        id: userId,
                        name: userName,
                    },
                    timestamp: new Date(),
                });
            }
        });
        socket.on('contact:update', (contactData) => {
            socket.broadcast.emit('contact:updated', {
                ...contactData,
                updatedBy: {
                    id: userId,
                    name: userName,
                },
                timestamp: new Date(),
            });
        });
        socket.on('typing:start', (data) => {
            socket.broadcast.to(data.roomId).emit('typing:start', {
                userId,
                userName,
                roomId: data.roomId,
            });
        });
        socket.on('typing:stop', (data) => {
            socket.broadcast.to(data.roomId).emit('typing:stop', {
                userId,
                userName,
                roomId: data.roomId,
            });
        });
        socket.on('disconnect', () => {
            logger_1.logger.info(`User ${userName} (${userId}) disconnected`);
            connectedUsers.delete(userId);
            socket.broadcast.emit('user:offline', {
                userId,
                userName,
                timestamp: new Date(),
            });
        });
        socket.on('error', (error) => {
            logger_1.logger.error(`Socket error for user ${userName}:`, error);
        });
    });
    const socketService = {
        notifyUser: (userId, event, data) => {
            const socketId = connectedUsers.get(userId);
            if (socketId) {
                io.to(socketId).emit(event, data);
            }
        },
        notifyTeam: (teamId, event, data) => {
            io.to(`team_${teamId}`).emit(event, data);
        },
        notifyDepartment: (department, event, data) => {
            io.to(`department_${department}`).emit(event, data);
        },
        broadcast: (event, data) => {
            io.emit(event, data);
        },
        getConnectedUsersCount: () => {
            return connectedUsers.size;
        },
        getConnectedUsers: () => {
            return Array.from(connectedUsers.keys());
        },
    };
    return socketService;
};
exports.socketHandler = socketHandler;
//# sourceMappingURL=socketService.js.map