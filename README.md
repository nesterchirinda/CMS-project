# CMS - Complaint Management System for ABC Limited 
A multi-tenant Complaint Management System (CMS) built as a Proof of Concept for the Software Architecture and Design module.

## Overview
The CMS enables consumers to submit and track complaints online, and allows help desk agents to manage and assign complaints to support persons. The PoC serves two tenants: NatWest Bank and Vodafone Telecom, with full data isolation between them.

## Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (hosted on Supabase)
- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Authentication:** JWT (jsonwebtoken)
- **Architecture:** Clean Architecture with Dependency Inversion Principle (DIP)

## Implemented Features
- US001: Consumer complaint submission with email notification
- US002: Consumer complaint status view and agent complaint dashboard
- US006: Agent assignment of complaints to support persons
- NFR06: WCAG 2.2 AA accessible frontend (WAVE score 10/10)
- Multi-tenant isolation enforced at database level via tenant_id filtering (ADR-04)

## Setup & Installation

### Prerequisites
- Node.js v16+
- A `.env` file with the following variables:

DATABASE_URL = db_url
JWT_SECRET = jwt_secret
PORT = 3000

### Database Setup
- Run `/database/schema.sql` in your Supabase SQL Editor to create tables
- Insert seed data manually via Supabase SQL Editor

### Installation
```bash
npm install
```

### Running the server
```bash
npm start
```
Then open `http://localhost:3000` in your browser.

## Running Tests
```bash
node node_modules\jest\bin\jest.js ComplaintService.test.js
```

## Project Structure
```
cms-project/
├── api-server/
│   ├── adapters/        # Controllers and middleware (Interface Adapters layer)
│   ├── application/     # Services and interfaces (Application layer)
│   ├── domain/          # Domain entities (Domain layer)
│   └── infrastructure/  # Repositories and DB connection (Infrastructure layer)
├── web-application/     # Frontend (HTML, CSS, JS)
└── database/            # SQL schema
```

## Architecture
This project implements Clean Architecture with Dependency Injection wiring in `api-server/index.js` as the Composition Root. The Strategy Pattern is applied to the Notification Service. The Data Mapper Pattern is used in `ComplaintRepository` to map raw SQL rows to domain objects, isolating the Domain layer from the database schema.
