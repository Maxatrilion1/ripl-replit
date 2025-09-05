# Backend Structure Document

This document outlines the backend setup for the Ripl MVP. It covers the architecture, databases, APIs, hosting, infrastructure, security, monitoring, and how everything fits together.

---

## 1. Backend Architecture

### Overall Design
- **Node.js & Express:** Our server runs on Node.js with the Express framework, which keeps things lightweight and easy to extend.  
- **Socket.IO:** Manages real-time features like live timers, reactions, and chat.  
- **Microservices-style modules:** While running in a single codebase for MVP, we organize code by feature (authentication, sessions, chat, admin) to keep each piece clear and maintainable.

### Scalability & Performance
- **Horizontal scaling:** Containers can be duplicated as traffic increases. A load balancer distributes incoming requests.  
- **Redis caching:** Real-time state (active timers, lobby info) lives in Redis for super-fast reads/writes.  
- **Asynchronous processing:** Tasks like sending calendar invites or SMS run in background jobs (e.g., with a simple worker), so our API calls stay snappy.

### Maintainability
- **Modular code structure:** Group routes, controllers, and services by domain (e.g., `auth/`, `sessions/`, `chat/`).  
- **Clear interfaces:** Each module exposes well-defined functions for other parts of the system, reducing interdependence.

---

## 2. Database Management

### Databases Used
- **MongoDB (NoSQL):** Main data store for users, sessions, friends, sprints, and chat history. Flexible documents fit our evolving schema needs.  
- **Redis:** In-memory store for real-time session state (timers, lobby participants) and rate-limiting counters.

### Data Practices
- **TTL (time-to-live) for ephemeral chat:** Chat messages expire shortly after a session ends, keeping storage lean.  
- **Indexes:** We index common query fields (e.g., user email, session share code, geolocation) to speed up lookups.  
- **Backups:** Daily snapshots of MongoDB collections to AWS S3 ensure we can recover from data loss.  
- **Sharding (future):** MongoDB is set up so we can shard across multiple servers if data volume grows rapidly.

---

## 3. Database Schema (Human-Readable)

### Collections & Key Fields

1. **Users**  
   • Unique ID, name, email, phone number  
   • Auth providers: LinkedIn profile ID, email/password hash, phone OTP flag  
   • Location (latitude, longitude)  
   • Remote passes remaining (integer)  
   • Settings (notifications, preferences)  
   • CreatedAt, updatedAt timestamps

2. **Friends**  
   • Record per friend relationship: requester ID, recipient ID  
   • Status: pending, accepted  
   • CreatedAt

3. **Sessions**  
   • Unique ID, host user ID  
   • Title, duration (minutes)  
   • Public or private flag  
   • Location point (latitude, longitude)  
   • Share code or link token  
   • StartTime, endTime  
   • Soft cap of 50 participants  
   • CreatedAt, updatedAt

4. **SessionParticipants**  
   • Session ID, user ID  
   • JoinTime  
   • Remote join flag (true/false)  
   • LeftAt (optional)

5. **Sprints**  
   • Unique ID, user ID  
   • Session ID (nullable for solo sprints)  
   • Duration, startTime, endTime  
   • Milestone badges earned  
   • CreatedAt

6. **ChatMessages**  
   • Session ID, user ID  
   • Message text, emoji reactions  
   • CreatedAt  
   • TTL index set to expire messages shortly after session end

7. **AdminMetrics**  
   • Session counts, invites sent, attendees per session  
   • Retention figures, active users  
   • Aggregated daily snapshots

---

## 4. API Design and Endpoints

### RESTful Approach
- Most data operations use JSON over HTTP with standard methods (GET, POST, PUT, DELETE).  
- Real-time events (chat, timer updates) go over Socket.IO.

### Key Endpoints

1. **Authentication**  
   • POST `/auth/linkedin` – handle LinkedIn OAuth callback  
   • POST `/auth/login` – email/password login  
   • POST `/auth/phone` – request OTP and verify phone number  
   • POST `/auth/jwt/refresh` – refresh tokens

2. **Users & Friends**  
   • GET `/users/me` – fetch user profile  
   • PUT `/users/me` – update profile or settings  
   • POST `/friends/request` – send friend request  
   • POST `/friends/accept` – accept incoming request  
   • DELETE `/friends/:id` – unfriend

3. **Solo Sprints**  
   • POST `/sprints/solo` – start a new solo sprint  
   • GET `/sprints/stats` – retrieve streaks and badges

4. **Coworking Sessions**  
   • POST `/sessions` – create session (public/private, location)  
   • GET `/sessions/nearby` – list public sessions within 50m radius  
   • GET `/sessions/:id` – session details and lobby info  
   • POST `/sessions/:id/join` – join session (checks location and remote passes)  
   • POST `/sessions/:id/leave` – leave session early

5. **Admin Dashboard**  
   • GET `/admin/metrics` – adoption, retention, invites, attendance stats  
   • POST `/admin/report-user` – report or block a disruptive user in a session

### Real-Time Channels (Socket.IO)
- **Namespaces/rooms** per session for live timer ticks, emoji reactions, confetti triggers, and ephemeral chat messages.

---

## 5. Hosting Solutions

### Cloud Provider
- **AWS** is our main host, chosen for reliability, global footprint, and pay-as-you-go pricing.

### Components
- **Elastic Container Service (ECS)** or **EC2 Auto Scaling Groups** to run Docker containers of our Node/Express app.  
- **AWS S3** for storing static assets (user avatars, badges, etc.).  
- **Amazon DocumentDB (MongoDB-compatible)** or managed MongoDB Atlas for our primary database.  
- **Amazon ElastiCache (Redis)** for real-time caching.

### Benefits
- **Reliability:** Built-in redundancy and automatic failover.  
- **Scalability:** Auto-scaling adjusts capacity with demand.  
- **Cost-effectiveness:** Only pay for what we use; tiered pricing keeps costs down for MVP traffic.

---

## 6. Infrastructure Components

### Load Balancing & Traffic Routing
- **AWS Application Load Balancer (ALB):** Distributes HTTP/HTTPS requests across containers.  
- **SSL/TLS termination** at the ALB ensures secure connections.

### Caching & Performance
- **Redis cluster:** Holds active timers, lobby state, rate limits (e.g., SMS OTP attempts).  
- **MongoDB secondary reads (future):** Offload read traffic to replicas if needed.

### Content Delivery
- **Amazon CloudFront (CDN):** Serves PWA assets (JavaScript, CSS, images) from edge locations for fast front-end load times.

### CI/CD Pipeline
- **GitHub Actions:** Build Docker images, run tests, push to container registry, and deploy to ECS/EC2.  
- **Docker images:** Ensure consistency across dev, staging, and production.

---

## 7. Security Measures

### Authentication & Authorization
- **OAuth 2.0 (LinkedIn)** for social login.  
- **JWT tokens:** Signed and short-lived for API sessions; refresh tokens stored securely.  
- **Phone OTP via Twilio:** Rate-limited and time-limited codes.

### Data Protection
- **TLS everywhere:** All traffic encrypted in transit.  
- **Encryption at rest:** MongoDB volume encryption, S3 server-side encryption.

### Best Practices
- **Helmet & CORS:** Secure headers and strict domain rules.  
- **Input validation & sanitization:** Prevent injection attacks.  
- **Rate limiting:** Throttle critical endpoints (login, OTP) to block abuse.

### Compliance
- **GDPR readiness:** Users can request data export or deletion; privacy by design.

---

## 8. Monitoring and Maintenance

### Monitoring Tools
- **AWS CloudWatch:** Tracks server CPU, memory, and custom application metrics (e.g., active sessions).  
- **Sentry:** Captures unhandled exceptions and performance bottlenecks in real time.  
- **Log aggregation:** Winston or Morgan logs pushed to a central store (e.g., CloudWatch Logs, ELK stack).

### Alerts & Health Checks
- **Automated alerts:** Notify on high error rates, CPU spikes, Redis or Mongo outages.  
- **Health check endpoints:** Load balancer pings `/health` to ensure container readiness.

### Maintenance Strategy
- **Blue/green deployments:** Minimize downtime when releasing updates.  
- **Scheduled backups:** Nightly database snapshots to S3.  
- **Dependency updates:** Quarterly security reviews and patching of libraries.

---

## 9. Conclusion and Overall Backend Summary

The Ripl backend combines Node.js, Express, MongoDB, Redis, and Socket.IO to power a real-time PWA for solo and group productivity sprints. Hosted on AWS with Docker and GitHub Actions, it’s built for quick scaling, high reliability, and secure data handling. From authentication (LinkedIn, email, phone) and location-aware sessions to ephemeral chat and admin analytics, every component is designed to meet MVP goals:

- Fast load times (sub-2s on 3G)
- Smooth real-time interactions (sub-second latency)
- Robust security (TLS, JWT, input validation)
- Clear maintainability (modular code, CI/CD, monitoring)

This setup ensures Ripl can grow comfortably from its pilot phase to full production, delivering accountability and community-driven focus wherever users are.
