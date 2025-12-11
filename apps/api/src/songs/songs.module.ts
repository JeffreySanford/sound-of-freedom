import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JobsModule } from '../jobs/jobs.module';
import { OllamaService } from '../llm/ollama.service';
import { OrchestratorService } from '../orchestrator/orchestrator.service';
import { SongsController } from './songs.controller';
import { MmslParserService } from './mmsl-parser.service';
import { StemExportService } from './stem-export.service';
import { SongDslParserService } from './song-dsl-parser.service';
import { InstrumentCatalogService } from './instrument-catalog.service';
import { LyricAnalysisService } from './lyric-analysis.service';
import { PaletteSuggestionService } from './palette-suggestion.service';

@Module({
  imports: [ConfigModule, JobsModule],
  controllers: [SongsController],
  providers: [
    OllamaService,
    OrchestratorService,
    MmslParserService,
    StemExportService,
    SongDslParserService,
    InstrumentCatalogService,
    LyricAnalysisService,
    PaletteSuggestionService,
  ],
  exports: [
    OllamaService,
    OrchestratorService,
    MmslParserService,
    StemExportService,
    SongDslParserService,
    InstrumentCatalogService,
    LyricAnalysisService,
    PaletteSuggestionService,
  ],
})
export class SongsModule {}
