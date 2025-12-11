import { Injectable, Logger } from '@nestjs/common';
import mongoose from 'mongoose';
import * as fs from 'fs';
import path from 'path';

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);
  private collectionName = process.env.LOG_MONGO_COLLECTION || 'logs';

  private async collection() {
    // Ensure we have connected Mongoose
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Database not initialized');
    }
    return mongoose.connection.db.collection(this.collectionName);
  }

  async query(filter: { level?: string; service?: string; start?: string; end?: string; limit?: number; skip?: number }) {
    const coll = await this.collection();
    const q: any = {};
    if (filter.level) q.level = filter.level;
    if (filter.service) q['meta.service'] = filter.service;
    if (filter.start || filter.end) {
      q.timestamp = {} as any;
      if (filter.start) q.timestamp.$gte = new Date(filter.start);
      if (filter.end) q.timestamp.$lte = new Date(filter.end);
    }
    const limit = filter.limit ? Math.min(filter.limit, 200) : 50;
    const skip = filter.skip || 0;
    const total = await coll.countDocuments(q);
    const items = await coll.find(q).sort({ timestamp: -1 }).skip(skip).limit(limit).toArray();
    return { total, items };
  }

  async stats() {
    const coll = await this.collection();
    const total = await coll.countDocuments({});
    let storageSize = 0;
    try {
      const st = await coll.stats();
      storageSize = st.size || 0;
    } catch (_e) {
      // ignore
    }
    return { total, storageSize };
  }

  async delete(filter: { before?: string; service?: string }) {
    const coll = await this.collection();
    const q: any = {};
    if (filter.service) q['meta.service'] = filter.service;
    if (filter.before) q.timestamp = { $lt: new Date(filter.before) };
    const res = await coll.deleteMany(q);
    return { deletedCount: res.deletedCount };
  }

  // Filesystem-based helpers to inspect rotated log files
  async listFiles(logDir?: string, filterService?: string) {
    const dir = logDir || process.env.LOG_DIR || path.join(process.cwd(), 'tmp', 'logs');
    try {
      const names = await fs.promises.readdir(dir);
      const files = [];
      for (const name of names) {
        if (filterService && !name.startsWith(filterService)) continue;
        try {
          const s = await fs.promises.stat(path.join(dir, name));
          files.push({ name, size: s.size, mtime: s.mtime });
        } catch (_e) {
          // ignore inaccessible files
        }
      }
      // sort by mtime desc
      files.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      return files;
    } catch (e) {
      return [];
    }
  }

  async tailFile(filePath: string, lines = 200, maxBytes = 128 * 1024) {
    // Efficiently tail the last N lines by reading the last chunk of the file
    // Enforce maxBytes to avoid returning huge payloads
    try {
      const stat = await fs.promises.stat(filePath);
      const size = stat.size;
      const chunkSize = Math.min(maxBytes, size);
      const fd = await fs.promises.open(filePath, 'r');
      const start = Math.max(0, size - chunkSize);
      const buf = Buffer.alloc(size - start);
      await fd.read(buf, 0, buf.length, start);
      await fd.close();
      const text = buf.toString('utf8');
      const allLines = text.split(/\r?\n/).filter(Boolean);
      return allLines.slice(-lines).join('\n');
    } catch (e) {
      return '';
    }
  }
}
