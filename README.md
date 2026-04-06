# MaquiBot Backend

Node.js backend modular monolith for WhatsApp lead conversion.

## Stack

- Node.js + Express
- Firestore via `firebase-admin`
- Twilio WhatsApp API
- Puppeteer (future proforma usage)
- Deploy target: Render

## Architecture

- `src/modules` business modules
- `src/services` external integrations
- `src/config` environment, logger and Firestore
- `src/utils` helper functions

## Implemented MVP Modules

- `webhook`: incoming WhatsApp messages
- `message`: message orchestration + persistence
- `conversation`: rules-based flow engine
- `lead`: lead retrieval, creation and updates
- `scoring`: lead score and category
- `handoff`: human takeover helper
- `proforma`: reserved for future
- `followup`: reserved for future

## Firestore Collections

- `leads`
- `messages`
- `proformas` (future)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment template:

   ```bash
   cp .env.example .env
   ```

3. Fill `.env` with production credentials.

Optional for local testing without Twilio quota consumption:

- Set `TWILIO_MOCK_ENABLED=true` in `.env`.
- In this mode outbound WhatsApp messages are simulated and logged, and conversation flow still updates Firestore.

4. Start server:

   ```bash
   npm run dev
   ```

## Endpoints

- `GET /health`
- `POST /webhook/whatsapp`

Twilio webhook should be configured to call `/webhook/whatsapp`.
