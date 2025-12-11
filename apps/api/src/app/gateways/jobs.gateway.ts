/**
 * Jobs Gateway
 * WebSocket gateway for real-time job status updates
 */

import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { Server, Socket } from 'socket.io';
import { JobsService } from '../../jobs/jobs.service';
import { Logger } from '@nestjs/common';

interface JobSubscribePayload {
  jobId: string;
}

interface JobStatusPayload {
  id: string;
  status: string;
}

interface JobProgressPayload {
  id: string;
  progress: {
    current: number;
    total: number;
    percentage: number;
    message: string;
  };
}

interface JobCompletedPayload {
  job: Record<string, unknown>;
}

interface JobFailedPayload {
  id: string;
  error: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class JobsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(JobsGateway.name);
  private userSockets = new Map<string, Socket>();

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jobsService: JobsService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth?.token;

    if (!token) {
      this.logger.warn(`Client ${client.id} connected without token`);
      client.disconnect();
      return;
    }

    try {
      const payload: any = this.jwtService.verify(token);
      const userId = payload?.sub;
      if (!userId) {
        this.logger.warn(`Client ${client.id} token missing subject`);
        client.disconnect();
        return;
      }

      // Validate user session / presence
      const user = await this.userModel.findById(userId).lean();
      if (!user) {
        this.logger.warn(`Client ${client.id} has invalid user in token: ${userId}`);
        client.disconnect();
        return;
      }

      this.userSockets.set(userId, client);
      this.logger.log(`Client ${client.id} connected (user: ${userId})`);
    } catch (err: any) {
      const message = (err && (err as any).message) || String(err);
      this.logger.warn(`Invalid token for client ${client.id}: ${message}`);
      client.disconnect();
      return;
    }
  }

  handleDisconnect(client: Socket): void {
    // Find and remove user from map
    for (const [userId, socket] of this.userSockets.entries()) {
      if (socket.id === client.id) {
        this.userSockets.delete(userId);
        this.logger.log(`Client ${client.id} disconnected (user: ${userId})`);
        break;
      }
    }
  }

  @SubscribeMessage('job:subscribe')
  handleSubscribeToJob(
    @MessageBody() data: JobSubscribePayload,
    @ConnectedSocket() client: Socket
  ): void {
    const room = `job:${data.jobId}`;
    // optional: ensure client is job owner (or admin) before joining
    try {
      const token = client.handshake.auth?.token;
      const userId = this.extractUserIdFromToken(token);
      if (userId) {
        this.jobsService.findJobById(data.jobId).then((job) => {
          if (!job) {
            client.emit('job:error', { message: 'Job not found' });
            return;
          }
          if (job.userId && job.userId !== userId) {
            client.emit('job:error', { message: 'Unauthorized to subscribe to this job' });
            return;
          }
          client.join(room);
          this.logger.log(`Client ${client.id} subscribed to job ${data.jobId}`);
        }).catch((err: any) => {
          const msg = (err && err.message) || String(err);
          this.logger.warn(`Error lookup job ${data.jobId}: ${msg}`);
          client.emit('job:error', { message: 'Error looking up job' });
        });
        return;
      }
    } catch (err) {
      // fallback to join
    }
    client.join(room);
    this.logger.log(
      `Client ${client.id} subscribed to job ${data.jobId}`
    );
  }

  @SubscribeMessage('job:unsubscribe')
  handleUnsubscribeFromJob(
    @MessageBody() data: JobSubscribePayload,
    @ConnectedSocket() client: Socket
  ): void {
    const room = `job:${data.jobId}`;
    client.leave(room);
    this.logger.log(
      `Client ${client.id} unsubscribed from job ${data.jobId}`
    );
  }

  @SubscribeMessage('jobs:subscribe:user')
  handleSubscribeToUserJobs(@ConnectedSocket() client: Socket): void {
    const token = client.handshake.auth?.token;
    const userId = this.extractUserIdFromToken(token);

    if (userId) {
      const room = `user:${userId}:jobs`;
      client.join(room);
      this.logger.log(`Client ${client.id} subscribed to user jobs`);
    }
  }

  @SubscribeMessage('jobs:unsubscribe:user')
  handleUnsubscribeFromUserJobs(@ConnectedSocket() client: Socket): void {
    const token = client.handshake.auth?.token;
    const userId = this.extractUserIdFromToken(token);

    if (userId) {
      const room = `user:${userId}:jobs`;
      client.leave(room);
      this.logger.log(`Client ${client.id} unsubscribed from user jobs`);
    }
  }

  // Server-side methods to broadcast job updates

  emitJobStatus(jobId: string, status: string): void {
    const room = `job:${jobId}`;
    const payload: JobStatusPayload = { id: jobId, status };
    this.server.to(room).emit('job:status', payload);
    this.logger.debug(`Emitted status update for job ${jobId}: ${status}`);
  }

  emitJobProgress(
    jobId: string,
    progress: {
      current: number;
      total: number;
      percentage: number;
      message: string;
    }
  ): void {
    const room = `job:${jobId}`;
    const payload: JobProgressPayload = { id: jobId, progress };
    this.server.to(room).emit('job:progress', payload);
    this.logger.debug(
      `Emitted progress update for job ${jobId}: ${progress.percentage}%`
    );
  }

  emitJobCompleted(job: Record<string, unknown>): void {
    const jobId = job['id'] as string;
    const userId = job['userId'] as string;
    const jobRoom = `job:${jobId}`;
    const userRoom = `user:${userId}:jobs`;
    const payload: JobCompletedPayload = { job };

    this.server.to(jobRoom).to(userRoom).emit('job:completed', payload);
    this.logger.log(`Emitted completion for job ${jobId}`);
  }

  emitJobFailed(jobId: string, userId: string, error: string): void {
    const jobRoom = `job:${jobId}`;
    const userRoom = `user:${userId}:jobs`;
    const payload: JobFailedPayload = { id: jobId, error };

    this.server.to(jobRoom).to(userRoom).emit('job:failed', payload);
    this.logger.log(`Emitted failure for job ${jobId}`);
  }

  emitJobStatusToUser(userId: string, jobId: string, status: string): void {
    const userRoom = `user:${userId}:jobs`;
    const payload: JobStatusPayload = { id: jobId, status };
    this.server.to(userRoom).emit('job:status', payload);
  }

  // Helper method to extract userId from JWT token
  private extractUserIdFromToken(token: string): string | null {
    if (!token) return null;
    try {
      const payload: any = this.jwtService.verify(token);
      return payload?.sub || null;
    } catch (err: any) {
      const message = (err && err.message) || String(err);
      this.logger.warn(`Failed to extract userId from token: ${message}`);
      return null;
    }
  }
}
