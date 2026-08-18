# All Roads V2 — checklist status

Last updated: 18 August 2026.

**System of record:** the showroom dashboard (Convex) owns car data, photos, inspection, contracts, publishing, and live car status. Heffl, if approved later, only receives copies. It does not write car status back.

**Out of V2 launch:** live payment gateway. Schema already has payment statuses and optional bank-transfer receipt upload.

---

## Done

### Sprint 0 — Foundations

- V2 statuses: `new` → review → inspection → contract → publish → reserved / booked / sold, plus withdrawn / expired
- Staff hide toggle (`publicHidden`) separate from status
- Audit and status logs; reason required on reject / withdraw
- VIN uniqueness; chassis never public
- `canPublish` gates: inspection verdict, signed unexpired contract, on-site confirm, asking price

### Sprint 1 — List your car

- Full `/consign` form (photos, docs, T&C)
- **AR-####** shown after submit
- Staff notify; nothing goes live on submit
- Owners cannot publish listings themselves

### Sprint 2 — Inspection and contracts

- Inspection form, printable report, verdict
- Contract lifecycle and expiry alerts
- Approve for publish stays locked until Sprint 0 gates pass

### Sprint 3 — Showroom

- Available Cars: search, filters, sort
- Detail: specs, lightbox, similar cars
- Photo desk: reorder, cover photo, WebP
- VIN never shown on the public site

### Sprint 4 — Buyers

- Inquiry presets and viewing request
- WhatsApp on cards and detail with stock, year, price, and link
- Staff and customer notifications

### Sprint 5 — Booking (no gateway)

- Book flow: reserved then booked, **BK-####**
- 5% deposit (min 200 OMR), no double-book, receipt upload
- `/admin/bookings` and `/booking-terms`
- No card gateway

### Sprint 6 — Site and SEO

- Homepage, About, Services, contact (map, `contact@allroads.om`)
- Bilingual RTL
- Per-car SEO, sitemap, robots, lazy photos

### Sprint 7 — Bot and Heffl (gated)

- Chat widget on the **homepage only**
- Published-only `GET /api/inventory` for the bot
- Wa-Agents webhook path exists
- **Heffl is off** until `HEFFL_ENABLED=true`

### Sprint 8 — Launch prep (code)

- Typecheck / lint
- Privacy mentions possible future Heffl
- Bot feed is published cars only

---

## Site polish (after the sprints)

- Compact showroom filters: search + price/year always visible; Filter opens the rest; Reset; name search as you type
- Hero: no WhatsApp / Call; shorter lead copy; car photo kept
- About: All Roads logo instead of the road photo
- Nav: Home, About, Services, Available Cars, List Your Car, Contact
- How it works **removed**
- List Your Car: Value-added services box **removed**
- First Services card links to `/inventory`
- Footer: Instagram / WhatsApp under C.R.; no landline, email, or map (location stays on the homepage block above)
- Showroom WhatsApp: **+968 9754 4534** via `https://api.whatsapp.com/send?phone=`
- Landline remains **+968 2243 1325** on the contact page

---

## Still open (ops / launch)

- Physical floor check vs live listings
- Confirm every live car has inspection + signed contract + unique stock
- Owner sign-off
- Production Convex deploy (`npx convex deploy`) — **not done**; production still runs the V1 schema
- Production site publish of this V2 batch
- Heffl copy-sync (optional, still off)
- Payment gateway (explicitly out of V2)

### Production safety

Pushing this V2 code to `master` would ship a Next.js app that calls bookings, inspections, and new vehicle statuses. Production Convex (`abundant-minnow-355`) still uses `pending_review | draft | published | hidden | sold | rejected` and has no bookings/inspections APIs. That mismatch would break the live site.

Keep V2 on a branch until Convex production is deployed in the same release.

---

## V2 launch acceptance (must all be true)

- [x] Code: no car can go live without inspection, approval, signed contract, and on-site confirm
- [x] Unique stock numbers; chassis never public
- [ ] Showroom matches the physical floor; sold / withdrawn / expired hidden
- [x] Search, detail, multi-angle photos work on phones
- [x] Inquiry per car; WhatsApp prefill; bot only published stock
- [x] Booking with deposit terms; no double-book
- [x] Staff notified on listing / inquiry / booking
- [x] Desk can run cars, inquiries, bookings
- [x] Status updates live on reserve / book / sale / withdraw
- [x] HTTPS, privacy (incl. future Heffl disclosure), booking T&Cs
- [ ] Owner sign-off
- [ ] Production Convex + Vercel released together
