import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '#common/helpers';

type JwtPayload = { userId: number; role: string } & jwt.JwtPayload;

export class NotificationGateway {
  private io: Server;
  private userSockets: Map<number, Set<string>> = new Map();
  private socketUsers: Map<string, number> = new Map();

  constructor(httpServer: HttpServer) {
    const origins = config<string[]>('app.allowed_origins', ['http://localhost:3000', 'http://localhost:3001']);
    const corsOrigin = origins.length === 1 && origins[0] === '*' ? true : origins;

    this.io = new Server(httpServer, {
      cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST'],
      },
    });

    this.io.use((socket, next) => {
      const token =
        socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      try {
        const secret = config('auth.jwtSecret', 'plantera-jwt-secret-dev');
        const decoded = jwt.verify(token as string, secret) as JwtPayload;
        (socket as any).user = { userId: decoded.userId, role: decoded.role };
        next();
      } catch {
        next(new Error('Invalid or expired token'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const user = (socket as any).user as JwtPayload;
      this.addUserSocket(user.userId, socket.id);

      socket.on('disconnect', () => {
        this.removeUserSocket(user.userId, socket.id);
      });
    });
  }

  private addUserSocket(userId: number, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
    this.socketUsers.set(socketId, userId);
  }

  private removeUserSocket(userId: number, socketId: string): void {
    this.socketUsers.delete(socketId);
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  emitToUser(userId: number, event: string, data: unknown): void {
    const socketIds = this.userSockets.get(userId);
    if (!socketIds) return;
    for (const socketId of socketIds) {
      this.io.to(socketId).emit(event, data);
    }
  }

  getConnectedUserIds(): number[] {
    return Array.from(this.userSockets.keys());
  }
}
