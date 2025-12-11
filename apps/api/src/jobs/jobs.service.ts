import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, JobDocument } from './schemas/job.schema';

@Injectable()
export class JobsService {
  constructor(@InjectModel(Job.name) private jobModel: Model<JobDocument>) {}

  async createJob(job: Partial<Job>): Promise<Job> {
    const create = new this.jobModel(job);
    return create.save();
  }

  async updateJob(jobId: string, patch: Partial<Job>): Promise<Job | null> {
    return this.jobModel.findOneAndUpdate({ id: jobId }, patch, { new: true }).exec();
  }

  async findJobById(jobId: string): Promise<Job | null> {
    return this.jobModel.findOne({ id: jobId }).exec();
  }

  async listJobs(query: Partial<Job> = {}): Promise<Job[]> {
    return this.jobModel.find(query).sort({ createdAt: -1 }).limit(100).exec();
  }
}

export default JobsService;
