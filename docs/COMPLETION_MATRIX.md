# Completion Matrix

Evidence is from repository inspection and test/build runs. Status is updated as work lands.

| Feature | Status | Evidence | Next action |
|---|---|---|---|
| App runs (backend health, frontend Vite) | PARTIAL | `backend/server.js`, `frontend/vite.config.js`; deps installed | Start servers; fix runtime errors |
| Frontend production build | COMPLETE | `frontend/package.json` `vite build`; Vite built 1,754 modules | Keep as release gate |
| Auth register/login | COMPLETE | `backend/controllers/authController.js`, `verify_phase2.js` | Keep; add farmer register UI |
| Admin login | COMPLETE | `frontend/src/pages/Login.jsx` | Keep |
| Google auth | COMPLETE | `authController.googleAuth`, GIS on Login | Keep |
| Logout / session restore | COMPLETE | `AuthContext.jsx` + `/auth/me` | Keep |
| JWT expiry / 401 | COMPLETE | `authMiddleware.js` TokenExpiredError; axios interceptor | Keep strict JWT validation |
| RBAC admin endpoints | COMPLETE | `authorize('FPO_ADMIN')` on admin routes | Keep; hide debug `/admin-only` in production |
| Password hashing / never returned | COMPLETE | User pre-save bcrypt; `select: false` | Keep |
| No JWT fallback secret | COMPLETE | `generateToken.js` requires `JWT_SECRET`; missing secret throws | Keep fail-closed configuration |
| ADMIN_SECRET fallback | COMPLETE | Admin registration requires configured `ADMIN_SECRET_KEY` and matching request key | Keep fail-closed configuration |
| CORS restricted | COMPLETE | `server.js` uses configured origins and denies browser origins when not configured in production | Keep allow-list deployment configuration |
| helmet / rate-limit | COMPLETE | Helmet is enabled and an authentication-rate limiter is mounted | Keep production configuration |
| No stack traces in prod | PARTIAL | `publicServerError` sanitizes selected paths; other handlers still return raw messages | Sanitize remaining production errors |
| Debug test endpoints | PARTIAL | `/api/auth/admin-only`, `/farmer-only` | Production-gated |
| Farmer dashboard (view) | PARTIAL | `FarmerDashboard.jsx` lists loans/docs/repay | Add apply, upload, stepper, cards |
| Farmer register UI | MISSING | API exists; Login is admin-oriented | Add `/register` |
| Farmer apply / upload UI | MISSING | APIs exist; client has no create/upload | Add forms + API methods |
| Farmer status/schedule/overdue UX | PARTIAL | tables; uses `repay.status` not `paymentStatus` | Fix field; cards; human labels |
| Farmer notifications UI | MISSING | no Notification API | Implement H then UI |
| Admin dashboard KPIs | PARTIAL | client-side from loans (limit 1000); no user count/KYC | Aggregation endpoint |
| Admin farmers | PARTIAL | derived from loans only | Dedicated farmer list |
| Documents upload pipeline | PARTIAL | Multer + Cloudinary + Mongo; MIME only | MIME+ext; owner-only preview |
| Document verify/reject | COMPLETE | admin routes + audit | Keep; notify farmer |
| PDF delivery | COMPLETE | Authenticated `/documents/:id/file` proxy and blob-backed frontend previews | Verified by production build and source scan |
| Loan state machine (central) | PARTIAL | per-handler checks; valid graph | Central guard + extra tests |
| Rejection reason | COMPLETE | required remarks | Audit log on reject |
| Repayment EMI / 0% | COMPLETE | `emiCalculator.js`; `verify_phase5.js` | Extra rounding tests |
| Partial/full/overpay | COMPLETE | phase5 | Guard CLOSED/non-DISBURSED |
| Overdue detection | COMPLETE | `overdueChecker.js` on-read | Notify EMI_OVERDUE |
| Auto CLOSED | COMPLETE | `markRepaymentPaid` | Notify LOAN_COMPLETED |
| Server validation | PARTIAL | most writes validated; tenure max missing | Bounds + ObjectId |
| IDOR loans/docs/repay | COMPLETE | farmer ownership checks; phase3/4 | Tests: notifications too |
| Notifications in-app | MISSING | admin page synthesizes from entities; Header mock | NotificationService + APIs |
| SMS/WhatsApp | MISSING | none | Stubs, never claim delivery |
| Reports CSV | PARTIAL | frontend loans/repayments; no injection escape | Admin CSV for missing types |
| Audit log | PARTIAL | model append-only; approve/disburse/docs; missing reject/under-review/repay | Record remaining; filters exist |
| i18n EN/TA | COMPLETE | i18next + locales + Header selector | Extend farmer keys (P2) |
| Voice assist | MISSING | none | P2 after P0/P1 |
| Secrets in tracked files | PARTIAL | `.gitignore` covers `.env`; fallbacks in source | Remove fallbacks; `.env.example` |
