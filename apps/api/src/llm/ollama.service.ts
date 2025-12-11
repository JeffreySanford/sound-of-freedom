import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { mapResponseForModel } from './mappers';
import { LyricAnalysisService } from '../songs/lyric-analysis.service';

export interface GeneratedMetadata {
  title: string;
  lyrics: string;
  genre: string;
  mood: string;
  syllableCount?: number;
}

export interface StructuredSongSection {
  lyrics: string[];
  chords: string[];
}

export interface GeneratedSong {
  title: string;
  artist?: string;
  genre: string;
  tempo: number;
  time_signature?: string;
  key: string;
  mood?: string;
  instrumentation: string[];
  syllableCount?: number;
  wordCount?: number;
  [key: string]: any; // Allow dynamic section properties
}

@Injectable()
export class OllamaService implements OnModuleInit {
  private readonly logger = new Logger(OllamaService.name);
  private available = false;
  private availableModels: string[] = [];
  private requireOllama: boolean;
  constructor(
    private readonly configService: ConfigService,
    private readonly lyricAnalysis: LyricAnalysisService
  ) {}

  // After construction we can initialize runtime-configured fields
  private initRuntime() {
    this.requireOllama = !!this.configService.get('REQUIRE_OLLAMA');
  }

  async onModuleInit() {
    this.initRuntime();
    // Check if Ollama is available during startup
    // Force restart trigger
    const maxAttempts = 3;
    let attempt = 0;
    while (attempt < maxAttempts) {
      attempt++;
      try {
        this.logger.log(`Checking Ollama availability at ${this.ollamaUrl}...`);
        const response = await axios.get(`${this.ollamaUrl}/api/tags`, {
          timeout: 5000,
        });
        const models = response.data?.models || [];
        this.availableModels = models.map((m: any) => m.name).filter(Boolean);
        const availableModels = models.map((m: any) => m.name);
        this.logger.log(
          `Ollama is available with models: ${availableModels.join(', ')}`
        );
        this.available = true;

        // Check if our configured model is available
        if (!availableModels.includes(this.model)) {
          this.logger.warn(
            `Configured model '${this.model}' not found in available models: ${availableModels.join(', ')}`
          );
          this.logger.warn('Song generation will fall back to sample metadata');
          this.logger.warn(`Check your OLLAMA_URL and docker compose setup; expected Ollama at ${this.ollamaUrl}`);
        }
        break; // success
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // For clarity in logs: reduce the noise for intermediate attempts; only
        // emit a warn or error at the final attempt. Keep `requireOllama` behavior.
        if (attempt < maxAttempts) {
          // Debug-level log for transient connectivity issues
          this.logger.debug(
            `Ollama connectivity attempt ${attempt}/${maxAttempts} failed at ${this.ollamaUrl}: ${errorMessage}`
          );
        } else {
          // final attempt - surface warning or error depending on requireOllama
          const logMsg = `Ollama is not available at ${this.ollamaUrl} (attempt ${attempt}/${maxAttempts}): ${errorMessage}`;
          if (this.requireOllama) {
            this.logger.error(logMsg);
          } else {
            this.logger.warn(logMsg);
          }
        }
        if (attempt < maxAttempts) {
          // small backoff
          // eslint-disable-next-line no-await-in-loop
          await new Promise((res) => setTimeout(res, 2000));
          continue;
        }
        // we've exhausted attempts; mark as unavailable and possibly abort
        this.available = false;
        this.logger.warn('Song generation will fall back to sample metadata');
        if (this.requireOllama) {
          throw new Error(`Ollama is required but unavailable at ${this.ollamaUrl}. Startup halted.`);
        }
      }
    }
  }

  async probe(): Promise<{ ok: boolean; url: string; message?: string }> {
    const url = this.ollamaUrl;
    try {
      const resp = await axios.get(`${url}/api/tags`, { timeout: 4000 });
      this.availableModels = resp.data?.models?.map((m: any) => m.name).filter(Boolean) || [];
      if (resp && resp.data) return { ok: true, url, message: 'OK' };
      return { ok: false, url, message: 'No data' };
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, url, message: msg };
    }
  }

  private get ollamaUrl(): string {
    // In Docker compose, the Ollama container is reachable at 'http://ollama:11434'
    return (
      this.configService.get<string>('OLLAMA_URL') || 'http://ollama:11434'
    );
  }

  private get model(): string {
    // Prefer a model that is likely installed in dev infra. Default to 'mistral:7b'
    return this.configService.get<string>('OLLAMA_MODEL') || 'mistral:7b';
  }

  private get fallbackModel(): string {
    // If a fallback model is not explicitly configured, prefer the robust Mistral 7B model
    return this.configService.get<string>('OLLAMA_FALLBACK_MODEL') || 'mistral:7b';
  }

  /**
   * Choose the best available model from a preferred list. Falls back to fallbackModel.
   */
  private chooseAvailableModel(preferred?: string): string {
    const prefs = [] as string[];
    if (preferred) prefs.push(preferred);
    // repository-preferred order
    prefs.push('mistral:7b');
    prefs.push('deepseek-coder:6.7b');
    prefs.push('minstral3');
    prefs.push(this.fallbackModel);
    for (const p of prefs) {
      if (this.isModelAvailable(p)) return p;
    }
    return this.fallbackModel;
  }

  private isModelAvailable(model: string): boolean {
    if (!model) return false;
    const lower = model.toLowerCase();
    for (const m of this.availableModels) {
      if (!m) continue;
      if (m.toLowerCase() === lower) return true;
      if (m.toLowerCase().startsWith(lower) || lower.startsWith(m.toLowerCase())) return true;
    }
    return false;
  }

  private cleanLyrics(lyrics: string, maxLines: number): string {
    if (!lyrics) return lyrics;
    const lines = lyrics
      .split(/\r?\n/)
      .map((l) => (l || '').trim())
      .filter(Boolean);
    const cleaned: string[] = [];
    const seenCounts = new Map<string, number>();
    for (const line of lines) {
      const count = seenCounts.get(line) || 0;
      // Allow up to 2 repeats of any identical line (for chorus/intentional repeats)
      if (count < 2) {
        // Keep order and avoid adjacent exact duplicates
        if (cleaned.length === 0 || cleaned[cleaned.length - 1] !== line) {
          cleaned.push(line);
          seenCounts.set(line, count + 1);
        } else if (count === 0) {
          // If immediate duplicate but we've not seen it before, allow once
          cleaned.push(line);
          seenCounts.set(line, count + 1);
        }
      }
      if (cleaned.length >= maxLines) break;
    }
    return cleaned.slice(0, maxLines).join('\n');
  }

  generateMetadata(
    narrative: string,
    durationSeconds: number,
    modelOverride?: string,
    requestId?: string
  ): Observable<GeneratedMetadata> {
    // Attempt to call the model provider regardless of availability probe; tests
    // and environments may mock the runtime or respond without an availability
    // probe being run. Any network or parse errors will fall back below.
    let model = modelOverride || this.model;
    // If the Ollama tag list is available and selected model is not present, choose the best available model
    if (this.available && !this.isModelAvailable(model)) {
      const chosen = this.chooseAvailableModel(modelOverride || model);
      this.logger.warn(`Configured model '${model}' not in available models ${this.availableModels.join(', ')}; selecting best available model: ${chosen}`);
      model = chosen;
    }
    // Guard: limit narrative length
    const maxLen = 1000;
    if (narrative.length > maxLen) {
      narrative = narrative.slice(0, maxLen);
    }

    // Get optimal lyric constraints based on attention span modeling
    const optimalLineCount =
      this.lyricAnalysis.getOptimalLineCount(durationSeconds);
    const diversityGuidelines = this.lyricAnalysis.getDiversityGuidelines();

    const prompt = `You are a music metadata generator. Output exactly one JSON object with keys: title, lyrics, genre, mood.

LYRICS REQUIREMENTS:
- Length: ${optimalLineCount} lines maximum (appropriate for ${durationSeconds}s song)
- Diversity: ${diversityGuidelines}
- Quality: Avoid repetitive filler words, maintain engagement throughout
- Structure: Clear progression with variety in rhythm and content

The output must be valid JSON only; no explanatory text.`;
    const body = {
      model,
      prompt: `${prompt}\n\nNarrative: ${narrative}`,
      stream: false,
      options: {
        temperature: 0.6,
        num_predict: 400,
      },
    };

    const axiosOpts: any = { timeout: 20_000 };
    if (requestId) axiosOpts.headers = { 'X-Request-Id': requestId };
    return from(
      axios.post(`${this.ollamaUrl}/api/generate`, body, axiosOpts)
    ).pipe(
      map((resp) => {
        const text = resp.data?.choices?.[0]?.text || resp.data?.text || resp.data?.response || '';
        // debug: raw text is inspected in tests when needed
        // Try to extract JSON from the resulting text
        const json = this.extractJson(text);
        this.logger.debug(`OllamaService parsed JSON: ${JSON.stringify(json)}`);
        if (!json) {
          throw new Error('Unable to parse JSON from model response');
        }
        const normalized = mapResponseForModel(model, json);
        this.logger.debug(`OllamaService normalized metadata: ${JSON.stringify(normalized)}`);
        // normalize and clean lyrics to avoid silly repetition
        const cleanedLyrics = this.cleanLyrics(normalized.lyrics || '', optimalLineCount);
        // If the output has very low diversity (e.g., repeating the same line),
        // treat it as low-quality and trigger a retry path.
        const uniqueLines = new Set(cleanedLyrics.split('\n').filter(Boolean));
        if (uniqueLines.size < Math.min(3, optimalLineCount)) {
          throw new Error('LowQualityLyrics');
        }
        const metadata: GeneratedMetadata = {
          title: normalized.title || 'Untitled',
          lyrics: cleanedLyrics || '',
          genre: normalized.genre || 'pop',
          mood: normalized.mood || 'calm',
        };
        metadata.syllableCount = this.estimateSyllables(metadata.lyrics);
        this.logger.debug(`OllamaService returning metadata: ${JSON.stringify(metadata)}`);
        return metadata;
      }),
      catchError((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        // Log HTTP details if present
        if ((err as any).response) {
          const r = (err as any).response;
          this.logger.warn(
            `Ollama model call returned ${r.status} ${r.statusText}: ${JSON.stringify(r.data)}`
          );
          // If we get a 404, attempt a secondary call with a fallback model and different options
          if (r.status === 404) {
            this.logger.warn('Ollama returned 404 - attempting fallback model call before using sample metadata');
            const fallbackBody = { ...body, model: this.fallbackModel, options: { temperature: 0.25, num_predict: 300 } };
            const fallbackOpts: any = { timeout: 20_000 };
            if (requestId) fallbackOpts.headers = { 'X-Request-Id': requestId };
            return from(axios.post(`${this.ollamaUrl}/api/generate`, fallbackBody, fallbackOpts)).pipe(
              map((resp2) => {
                  const text2 = resp2.data?.response || '';
                  this.logger.debug(`OllamaService generateMetadata fallback raw text: ${String(text2)}`);
                const json2 = this.extractJson(text2);
                if (!json2) {
                  throw new Error('Unable to parse JSON from fallback model response');
                }
                const normalized2 = mapResponseForModel(this.fallbackModel, json2);
                const cleanedLyrics2 = this.cleanLyrics(normalized2.lyrics || '', optimalLineCount);
                const metadata2: GeneratedMetadata = {
                  title: normalized2.title || 'Untitled',
                  lyrics: cleanedLyrics2 || '',
                  genre: normalized2.genre || 'pop',
                  mood: normalized2.mood || 'calm',
                };
                metadata2.syllableCount = this.estimateSyllables(metadata2.lyrics);
                return metadata2;
              }),
              catchError(() => from([this.generateSample(narrative, durationSeconds)]))
            );
          }
        }
        // If the model produced low-quality lyrics, we log and fall back to sample metadata.
        if (msg === 'LowQualityLyrics' || msg.includes('LowQualityLyrics')) {
          this.logger.warn('Detected low-quality lyrics from model; falling back to sample metadata');
        }
        this.logger.warn(
          'Ollama model call failed, falling back to sample metadata: ' + msg
        );
        // Fallback generated metadata - same shape as in frontend sample
        const sample = this.generateSample(narrative, durationSeconds);
        return [sample];
      })
    );
  }

  suggestGenres(
    narrative: string,
    modelOverride?: string,
    requestId?: string
  ): Observable<string[]> {
    const model = modelOverride || this.model;
    // Guard: limit narrative length
    const maxLen = 1000;
    if (narrative.length > maxLen) {
      narrative = narrative.slice(0, maxLen);
    }

    const prompt = `You are a music genre expert. Analyze the following narrative and suggest 3-5 musical genres that would best fit this story. Return exactly a JSON array of genre names from our available genres. Available genres: 1940s Big Band, Rat Pack (Swing/Lounge), Jazz, Blues, Rock 'n' Roll, Classical, Pop, Hip Hop, Country, Folk, Electronic/Dance, Reggae, Industrial, House, Metal, Gospel, Melodic Rock Ballads.

Output must be valid JSON array only; no explanatory text.`;

    const body = {
      model,
      prompt: `${prompt}\n\nNarrative: ${narrative}`,
      temperature: 0.3,
      max_tokens: 200,
    };

    // Always attempt genre suggestion; fallback handled on error
    const axiosOpts2: any = { timeout: 15_000 };
    if (requestId) axiosOpts2.headers = { 'X-Request-Id': requestId };
    return from(
      axios.post(`${this.ollamaUrl}/v1/completions`, body, axiosOpts2)
    ).pipe(
      map((resp) => {
        const text = resp.data?.choices?.[0]?.text || resp.data?.text || '';
        const json = this.extractJson(text);
        if (Array.isArray(json)) {
          return json;
        } else {
          throw new Error('Response is not a valid genre array');
        }
      }),
      catchError((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          'Ollama genre suggestion failed, falling back to defaults: ' + msg
        );
        // Fallback: return some general genres
        return [['Pop', 'Rock', 'Electronic/Dance']];
      })
    );
  }

  generateSong(
    narrative: string,
    durationSeconds: number,
    modelOverride?: string
    , requestId?: string
  ): Observable<GeneratedSong> {
    const model = modelOverride || this.model;
    // Guard: limit narrative length
    const maxLen = 1500;
    if (narrative.length > maxLen) {
      narrative = narrative.slice(0, maxLen);
    }

    const prompt = `Generate a complete song structure as JSON. Return ONLY valid JSON, no other text.

{
  "title": "Java and JavaScript",
  "artist": "Your Name",
  "genre": "Nerd Pop",
  "tempo": 120,
  "time_signature": "4/4",
  "key": "C major",
  "mood": "energetic",
  "instrumentation": ["synthesizer", "drums", "bass", "male_voice"],
  "verse_1": {
    "lyrics": [
      "Java, oh Java, you're a staple of the old,",
      "Your syntax elegant, standing tall and bold.",
      "With your Object-Oriented design, you've got it all,"
    ],
    "chords": ["C", "G", "Am", "F"]
  },
  "verse_2": {
    "lyrics": [
      "JavaScript, JavaScript, modern and agile,",
      "In web development, you're the essential file.",
      "Async operations and DOM manipulation, you're a pro,"
    ],
    "chords": ["G", "Am", "F", "C"]
  },
  "chorus": {
    "lyrics": [
      "Together they unite to create harmony.",
      "JavaScript in the browser, Java on the server side,"
    ],
    "chords": ["C", "G", "Am", "F"]
  },
  "bridge": {
    "lyrics": [
      "Though different in syntax and purpose they may be,",
      "Together they unite to create harmony."
    ],
    "chords": ["Am", "Dm7", "G", "C"]
  }
}
>>>>>>> 0413b4a

Narrative: ${narrative}

Important: Include chord progressions that fit the key and genre. Structure the song with verse_1, verse_2, chorus, and optionally bridge/outro sections.`;
    const body = {
      model,
      prompt: `${prompt}\n\nNarrative: ${narrative}`,
      stream: false,
      options: {
        temperature: 0.3, // Lower temperature for more consistent JSON
        num_predict: 400,
      },
    };

    // Model call follows below; fallback to metadata is handled in catch
    
    const axiosOpts3: any = { timeout: 25_000 };
    if (requestId) axiosOpts3.headers = { 'X-Request-Id': requestId };
    return from(
      axios.post(`${this.ollamaUrl}/api/generate`, body, axiosOpts3)
    ).pipe(
      map((resp) => {
        const text = resp.data?.choices?.[0]?.text || resp.data?.text || resp.data?.response || '';
        this.logger.debug(`Ollama raw response: ${text}`);
        const json = this.extractJson(text);
        if (!json) {
          this.logger.error(`Failed to parse JSON from: ${text}`);
          throw new Error('Unable to parse JSON from model response');
        }
        const normalized = mapResponseForModel(model, json);
        // Convert structured song format to flat format for compatibility
        const song: GeneratedSong = {
          title: normalized.title || 'Untitled',
          artist: json.artist || 'AI Composer',
          genre: normalized.genre || 'pop',
          tempo: json.tempo || this.getDefaultTempo(normalized.genre || 'pop'),
          time_signature: json.time_signature || '4/4',
          key: json.key || 'C major',
          mood: json.mood || 'energetic',
          instrumentation: Array.isArray(json.instrumentation)
            ? json.instrumentation
            : ['piano', 'guitar', 'drums', 'male_voice'],
          melody: json.melody || (normalized as any).melody,
        };

        // Convert structured sections or top-level lyrics to flat lyrics
        const sections = ['verse_1', 'verse_2', 'chorus', 'bridge', 'outro'];
        let allLyrics = '';
        let totalSyllables = 0;

        // If the model returned a top-level `lyrics` field, prefer it
        if (json.lyrics) {
          const ltext = Array.isArray(json.lyrics) ? json.lyrics.join('\n') : json.lyrics;
          allLyrics += ltext + '\n\n';
          totalSyllables += this.estimateSyllables(ltext);
        }

        sections.forEach((section) => {
          if (json[section]) {
            song[section] = json[section];
            if (json[section].lyrics) {
              const sectionLyrics = Array.isArray(json[section].lyrics)
                ? json[section].lyrics.join('\n')
                : json[section].lyrics;
              allLyrics += `[${section.toUpperCase()}]\n${sectionLyrics}\n\n`;
              totalSyllables += this.estimateSyllables(sectionLyrics);
            }
          }
        });

        song.syllableCount = totalSyllables;
        song.wordCount = allLyrics.split(/\s+/).length;
        song.lyrics = allLyrics.trim();

        return song;
      }),
      catchError((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          'Ollama song generation failed, falling back to metadata + defaults: ' +
            msg
        );
        // Fallback: generate metadata + add default song elements
        return this.generateMetadata(narrative, durationSeconds, model).pipe(
          map((metadata) => {
            const song: GeneratedSong = {
              title: metadata.title,
              artist: 'AI Composer',
              genre: metadata.genre,
              tempo: this.getDefaultTempo(metadata.genre),
              time_signature: '4/4',
              key: 'C major',
              mood: metadata.mood,
              instrumentation: [
                'piano',
                'guitar',
                'bass',
                'drums',
                'male_voice',
              ],
              verse_1: {
                lyrics: metadata.lyrics.split('\n'),
                chords: ['C', 'G', 'Am', 'F'],
              },
            };
            song.syllableCount = metadata.syllableCount;
            song.wordCount = metadata.lyrics.split(/\s+/).length;
            return song;
          })
        );
      })
    );
  }

  // Normalization handled by per-model mappers in `mappers.ts`

  private extractJson(text: string): any | null {
    // Clean the text first
    const cleaned = text.trim();

    // Try to parse the entire response as JSON first
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      // If that fails, try to find JSON within the text
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1 || end <= start) return null;

      const candidate = cleaned.substring(start, end + 1);
      try {
        return JSON.parse(candidate);
      } catch (e2) {
        // Try to replace single quotes with double quotes for common mistakes
        try {
          const fixed = candidate
            .replace(/'/g, '"') // Replace single quotes
            .replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Add quotes around unquoted keys
          return JSON.parse(fixed);
        } catch (e3) {
          return null;
        }
      }
    }
  }

  private estimateSyllables(text: string): number {
    if (!text) return 0;
    const words = text
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/);
    return words.reduce((count, word) => {
      if (!word) return count;
      const groups = word.match(/[aeiouy]+/g);
      let s = groups ? groups.length : 0;
      if (word.endsWith('e') && s > 1) s--;
      return count + Math.max(1, s);
    }, 0);
  }

  private getDefaultTempo(genre: string): number {
    const genreTempos: Record<string, number> = {
      '1940s big band': 180,
      'rat pack (swing/lounge)': 140,
      jazz: 120,
      blues: 90,
      "rock 'n' roll": 160,
      classical: 110,
      pop: 120,
      'hip hop': 95,
      country: 110,
      folk: 100,
      'electronic/dance': 128,
      reggae: 80,
      industrial: 130,
      house: 125,
      metal: 150,
      gospel: 100,
      'melodic rock ballads': 85,
    };
    return genreTempos[genre.toLowerCase()] || 120;
  }

  private generateSample(
    narrative: string,
    durationSeconds: number
  ): GeneratedMetadata {
    // Minimal fallback generator
    const first = (narrative && narrative.split(/\.|,|\n/)[0]) || '';
    const title = (first && first.slice(0, 40)) || 'Untitled';
    // Keep the lyrics length roughly aligned with duration via repeats
    const sampleLines = [
      'Walking through the sun, the city hums all day',
      'Sunny rooftops shine and children laugh then play',
      'Bright reflection sparkles off the glass and tree',
      "Your hand in mine as we dance through the streets",
      'Catchy chorus repeats, and the chorus lifts us high',
      "Verse unfolds with varied lines and the skyline sighs",
      'A chorus hook that’s short and earworm-y by design',
      'Bridge brings a hint of longing then we return to rhyme',
    ];
    let lyrics = sampleLines.join('\n');
    // We don't use durationSeconds heavily here but use it to repeat verses if longer
    // Extend the sample lyrics to approximately the target word count with varied lines
    const targetWords = Math.round(((durationSeconds || 30) * 4.5) / 4) * 4;
    let currentWords = lyrics.split(/\s+/).length;
    let idx = 0;
    while (currentWords < targetWords) {
      lyrics += '\n' + sampleLines[idx % sampleLines.length];
      idx++;
      currentWords = lyrics.split(/\s+/).length;
      if (idx > 50) break; // safety cap
    }
    const genre = 'pop';
    const mood = 'melancholic';
    return {
      title,
      lyrics,
      genre,
      mood,
      syllableCount: this.estimateSyllables(lyrics),
    };
  }
}

export default OllamaService;
