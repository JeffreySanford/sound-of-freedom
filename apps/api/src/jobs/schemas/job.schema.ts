import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobDocument = Job & Document;

@Schema({ timestamps: true })
export class Job {
  @Prop({ required: true, unique: true })
  id: string; // job id from orchestrator

  @Prop({ required: false })
  userId?: string;

  @Prop({ required: true })
  narrative: string;

  @Prop({ required: true })
  duration: number;

  @Prop({ required: false })
  generator?: string;

  @Prop({ required: false })
  model?: string;

  @Prop({ type: Object })
  options?: Record<string, any>;

  @Prop({ default: 'queued' })
  status: string;

  @Prop({ required: false })
  startedAt?: Date;

  @Prop({ required: false })
  completedAt?: Date;

  @Prop({ required: false })
  artifactUrl?: string;

  @Prop({ required: false, type: Object })
  result?: Record<string, any>;

  @Prop({ required: false, type: Object })
  progress?: { current?: number; total?: number; percentage?: number; message?: string };

  @Prop({ required: false })
  attempts?: number;

  @Prop({ required: false })
  error?: string;

  @Prop({ required: false })
  requestId?: string;
}

export const JobSchema = SchemaFactory.createForClass(Job);
