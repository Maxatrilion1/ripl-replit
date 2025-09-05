# Security Guidelines for Ripl PWA

This document outlines the security principles, controls, and best practices to guide the design, implementation, and operation of Ripl—a hybrid productivity and social coworking Progressive Web App (PWA). It aligns with our core security mandate: **Security by Design**, **Least Privilege**, and **Defense in Depth**.

---

## 1. Secure Design Principles

- **Security by Design**: Incorporate threat modeling and security requirements in every sprint. Treat security as a first-class feature.
- **Least Privilege**: Grant users, services, and containers only the permissions they need.
- **Defense in Depth**: Layer controls—network policies, firewalls, API gateways, input validation, and monitoring.
- **Fail Securely**: On errors or timeouts, default to a safe state. Avoid leaking stack traces or sensitive info.
- **Secure Defaults**: Ship with secure configuration (e.g., disabled debug, strong ciphers, CSP enabled).

---

## 2. Authentication & Access Control

### 2.1 Authentication Flows
- **LinkedIn OAuth2**: Use OAuth 2.0 with PKCE for PKI flows in the PWA. Protect client secrets in a vault (AWS Secrets Manager).
- **Email/Password**: Enforce password complexity (min. 12 chars, mix of letters, digits, symbols). Hash with Argon2id or bcrypt + unique salt.
- **Phone/SMS OTP**: Rate-limit OTP requests. Use a trusted SMS provider and verify codes server-side.

### 2.2 Session & Token Management
- **JWT**
  - Sign with RS256 or HS256 using strong secrets/keys.
  - Include `iss`, `aud`, `sub`, `exp`, and rotate keys periodically.
  - Access tokens: short-lived (e.g., 15m). Refresh tokens: stored in HttpOnly, Secure, SameSite=Strict cookies.
  - Validate signature, `exp`, and token revocation on every request.
- **Session Timeouts**: Implement idle (e.g., 15m) and absolute timeouts (e.g., 24h). Provide explicit logout API to revoke refresh tokens.
- **Anti–Session Fixation**: Issue a new JWT upon re-authentication or privilege changes.

### 2.3 Role-Based Access Control (RBAC)
- **Roles**: `participant`, `host`, `admin`.
- **Enforcement**: Server-side middleware checks JWT scopes/roles for every protected API. No front-end enforcement only.
- **Privilege Escalation**: Deny any operation not explicitly permitted by the user’s role.

### 2.4 Multi-Factor Authentication (MFA)
- **Admin & Host**: Require optional MFA (TOTP or SMS) for sensitive operations (e.g., session termination, user moderation).

---

## 3. Input Validation & Output Encoding

- **Server-Side Validation**: Use a validation library (e.g., `express-validator`) for all JSON, URL, and form inputs.
  - Validate types, lengths, patterns (e.g., sprint titles, chat messages).
- **Prevent Injection**:
  - **Database**: Use Mongoose ORM with parameterized queries. Never build queries via string concatenation.
  - **NoSQL Injection**: Sanitize MongoDB operators. Reject inputs starting with `$` or containing `.` in keys.
- **Output Encoding**:
  - Encode all user-generated content in HTML contexts. Use a React sanitizer (e.g., `dompurify`) before dangerously setting inner HTML.
- **Redirects & Forwards**: Maintain an allow-list of redirect URIs. Reject unrecognized targets.

---

## 4. Data Protection & Privacy

### 4.1 Encryption
- **In Transit**: Enforce TLS 1.2+ with HSTS (`Strict-Transport-Security` header). Redirect HTTP → HTTPS at the load balancer.
- **At Rest**:
  - MongoDB: Enable storage encryption; use a customer-managed key via AWS KMS.
  - Redis: Use `requirepass` and enable TLS if supported, or run in a private subnet.
  - S3: Enable SSE-AES256 or SSE-KMS. Restrict bucket policies to the application IAM role.

### 4.2 Secrets Management
- Store all OAuth credentials, JWT keys, and SMS API keys in a secure vault (AWS Secrets Manager or HashiCorp Vault).
- Do **not** hardcode any secrets in code or config files. Rotate keys quarterly or upon suspected compromise.

### 4.3 Privacy & GDPR
- **Data Minimization**: Collect only necessary PII (email, phone). Store location data only during active sessions.
- **Data Retention**: Pilot retains jam data and activity logs. Plan extension for automated purge and user-driven deletion in v2.
- **User Requests**: Provide endpoints to export or delete personal data.

---

## 5. API & Service Security

- **Rate Limiting**: Use `express-rate-limit` to throttle login, signup, OTP, and invite endpoints. E.g., 5 OTPs/hour/IP.
- **CORS**: Restrict origins to `https://app.ripl.com` (and staging domains). Allow only needed methods and headers.
- **HTTP Methods**: Enforce RESTful verbs. Disallow state changes via GET.
- **Versioning**: Prefix routes with `/api/v1/` to manage backward compatibility securely.
- **Error Handling**: Return generic messages (e.g., “Invalid credentials”). Log full stack traces internally but never expose them.

---

## 6. Frontend (React/PWA) Security

- **Content Security Policy**: Define a strict CSP header allowing only self-hosted scripts and whitelisted CDN sources with SRI.
- **Service Workers**: Scope limited to PWA assets. Validate fetch requests; do not cache sensitive API responses.
- **Storage**: Avoid storing JWTs or PII in `localStorage`/`sessionStorage`. Use HttpOnly cookies.
- **Third-Party Scripts**: Load via SRI. Vet via a dependency vulnerability scanner.

---

## 7. Backend (Node.js / Express) Security

- **HTTP Headers**: Use `helmet` to set `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Feature-Policy`.
- **Input Sanitization**: Leverage `helmet.xssFilter()` plus manual sanitization for chat and user data.
- **Dependency Management**: Maintain a `package-lock.json`, run `npm audit`, and integrate SCA (e.g., Dependabot/GitHub Advanced Security).
- **Logging**: Centralize logs in AWS CloudWatch. Mask PII and avoid logging full JWTs.

---

## 8. Infrastructure & CI/CD

- **Docker**: Use minimal base images (e.g., Alpine). Scan images for vulnerabilities.
- **AWS Networking**: Place databases and Redis in private subnets. Expose only load-balanced ports 443/80.
- **S3 Bucket Policies**: Restrict to the application’s IAM role. Block public access.
- **GitHub Actions**:
  - Store secrets in GitHub Encrypted Secrets.
  - Use ephemeral runners. Pin action versions.
  - Fail builds on high-severity vulnerabilities.

---

## 9. Admin Dashboard & Moderation

- **Access Control**: Restrict to `admin` role via strong auth + MFA.
- **Audit Trails**: Log all moderation actions (reports, blocks, removals) with user, timestamp, and action.
- **Rate Limiting**: Throttle dashboard operations to prevent data scraping or DOS.

---

## 10. Monitoring, Alerting & Incident Response

- **Real-Time Monitoring**: Use AWS CloudWatch + PagerDuty for critical metrics (auth failures, error spikes, 5xx rates).
- **SIEM Integration**: Forward logs to a SIEM for anomaly detection.
- **Incident Playbook**: Document roles, communication channels, and containment steps for security incidents.
- **Periodic Audits**: Quarterly penetration tests and annual compliance reviews.

---

## 11. Developer Security Practices

- **Code Reviews**: Mandate peer review for all security-relevant changes.
- **Static Analysis**: Integrate ESLint with security plugins (e.g., eslint-plugin-security).
- **Secrets Scanning**: Enforce pre-commit hooks to detect accidental secret commits.
- **Training**: Provide OWASP Top 10 & secure-coding training to all engineers.

---

Adherence to these guidelines ensures Ripl is built with a robust security posture, balancing user convenience and strong protection. All findings, exceptions, or design questions must be flagged to the Security Lead for review prior to release.