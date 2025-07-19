# Bitespeed Backend Task – Identity Reconciliation

This project solves the identity reconciliation problem as specified in the Bitespeed assignment.  
Built with Node.js, Express, and Prisma using a PostgreSQL database.

## Features
- POST /identify – reconciles user identity based on phone/email
- Prisma ORM with Supabase/PostgreSQL
- DB health check via GET /

## Setup
1. Clone the repo
2. Install deps: `npm install`
3. Set up `.env` with your DATABASE_URL
4. Run with `node index.js` or `nodemon`
