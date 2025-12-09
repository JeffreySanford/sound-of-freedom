# Harmonia — Detailed Idea and Plan

## Overview

Harmonia is an AI-driven music harmonization platform allowing performers and producers to quickly prototype harmonic
arrangements for melodies, riffs, and complete songs. The system focuses on melodic context, stylistic reharmonization,
and collaborative editing.

## Goals

- Help artists generate harmonies quickly.
- Preserve the original musical intent while offering creative variations.
- Integrate with DAWs and support MIDI import/export.

## User Stories

- As a composer, I want to input a MIDI melody and receive suggested chord progressions.
- As an arranger, I want to apply a genre-specific reharmonization to a song section.
- As a collaborator, I want to share and annotate suggested harmonies with team members.

## Features (MVP then Advanced)

- MVP:
  - MIDI import/export
  - Basic chord suggestions and playback
  - Simple UI with editing of chords and voicings
- Advanced:
  - Audio-to-MIDI transcription
  - Style transfer with genre presets (jazz, pop, orchestral)
  - AI-based voice-leading and inversions
  - Collaboration and versioning

## Architecture Sketch

- Frontend: React app (player, editor) using Tone.js
- Backend: Node.js (NestJS) for APIs; Python microservice for ML
- Storage: Postgres + S3
- ML: PyTorch for models trained on tokenized MIDI sequences

## Metrics of Success

- Time to get first useful harmony (target: under 2 minutes)
- User adoption in prototype testing
- Reliability of generated chords (measured by acceptance rate from test users)

## First Tasks

1. Create a small prototype that imports MIDI and plays melodies with suggested chords.
2. Build a REST API for chord suggestion from a melody input.
3. Add a minimal UI for previewing suggestions and editing.

## Open Questions

- Which model architecture gives the best balance of musicality and latency?
- How will we integrate with existing DAWs in a frictionless way?
- Do we provide an offline desktop app as well as a web app?

---

This document is a starting point for implementing the Harmonia idea.
