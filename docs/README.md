# LexRam 2.0 - Official eCourts API Documentation

**Official Alternatives to SCI Mobile App Reverse-Engineering**

---

## 📚 Documentation Index

| Document | Purpose | Status |
|----------|---------|--------|
| [OFFICIAL_ECOURTS_API_ALTERNATIVES.md](./OFFICIAL_ECOURTS_API_ALTERNATIVES.md) | Complete official API documentation | ✅ Complete |
| [OFFICIAL_VS_UNOFFICIAL_API_COMPARISON.md](./OFFICIAL_VS_UNOFFICIAL_API_COMPARISON.md) | Side-by-side comparison | ✅ Complete |
| [API_MIGRATION_CODE_GUIDE.md](./API_MIGRATION_CODE_GUIDE.md) | Implementation code examples | ✅ Complete |

---

## 🎯 Quick Summary

### The Problem
LexRam 2.0 currently uses a **reverse-engineered** approach to access the SCI (Supreme Court of India) mobile app API. This method is:
- ❌ Fragile (breaks when website changes)
- ❌ CAPTCHA-blocked (~30-40% failure rate)
- ❌ Legally gray area
- ❌ High maintenance overhead

### The Solution
Official government-approved APIs are now available:

| API | Type | Cost | Setup Time | Recommended For |
|-----|------|------|------------|-----------------|
| **eCourts Open API** | Government | ₹0.50/case | 4-6 weeks | Production/Scale |
| **eCourtsIndia API** | Commercial | ₹3/request | Instant | Testing/Bridge |

---

## 🚀 Quick Start

### Option 1: eCourtsIndia (Instant Access)

```bash
# 1. Sign up at https://ecourtsindia.com/api
# 2. Get API key immediately
# 3. Add to .env.local:
ECOURTSINDIA_API_KEY=your_key_here

# 4. Test:
curl -X POST https://api.ecourtsindia.com/v2/case/details \
  -H "X-API-Key: your_key" \
  -d '{"cnr": "TNCH090011702023"}'
```

### Option 2: eCourts Open API (Recommended for Production)

```bash
# 1. Apply at https://bharatapi.gov.in
# 2. Wait 4-6 weeks for approval
# 3. Get Department ID and Bearer token
# 4. Add to .env.local:
ECOURTS_OPEN_API_KEY=eci_live_XXXXX
ECOURTS_OPEN_DEPARTMENT_ID=DEPT_XXXXX

# 5. Test:
curl https://api.bharatapi.gov.in/ecourts/v1/api/partner/case/TNCH090011702023 \
  -H "Authorization: Bearer eci_live_XXXXX" \
  -H "Department-Id: DEPT_XXXXX"
```

---

## 📊 Comparison at a Glance

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API COMPARISON                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SCI Mobile (Current)          eCourts Open API      eCourtsIndia API       │
│  ───────────────────           ───────────────       ───────────────        │
│                                                                             │
│  🔄 Reverse-engineered    →    ✅ Official      →    ✅ Commercial          │
│  🐢 Slow (15-30s)         →    ⚡ Fast (<1s)    →    ⚡ Fast (<1s)          │
│  ❌ 60-70% success        →    ✅ 99%+ success  →    ✅ 99%+ success        │
│  💰 Hidden compute costs  →    ₹0.50/case       →    ₹3/request             │
│  🔓 No authentication     →    Bearer token     →    API key                │
│  ⚠️  Legal risk           →    ✅ Government    →    ✅ Licensed            │
│  🚫 No support            →    Official support →    Dedicated support      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛣️ Migration Roadmap

### Week 1: Immediate Actions
- [ ] Register for **eCourtsIndia API** (30 free credits)
- [ ] Apply for **eCourts Open API** (start approval process)
- [ ] Review current API usage patterns

### Week 2-3: Development
- [ ] Implement API client abstraction layer
- [ ] Add fallback strategy (Official → Commercial → Scraper)
- [ ] Set up caching layer (Redis)

### Week 4-6: Testing
- [ ] Unit tests for all providers
- [ ] Integration tests for fallback logic
- [ ] Performance benchmarking

### Week 7-8: Rollout
- [ ] 10% → 50% → 100% traffic migration
- [ ] Monitor error rates and costs
- [ ] Update documentation

---

## 💰 Cost Analysis

### Current (Hidden Costs)
```
Compute (Playwright)      ₹3,000-5,000/month
CAPTCHA handling          ₹2,000-4,000/month  
Maintenance (dev time)    ₹10,000-20,000/month
────────────────────────────────────────────
TOTAL                     ₹15,000-30,000/month
```

### Official APIs (Transparent Costs)

| Volume | eCourts Open | eCourtsIndia |
|--------|--------------|--------------|
| 1,000 requests | ₹500 | ₹3,000 |
| 10,000 requests | ₹5,000 | ₹5,000* |
| 50,000 requests | ₹25,000 | ₹15,000* |

*Enterprise plan

---

## 🔧 Implementation Files

### New Files to Create
```
lib/ecourts-api/
├── index.ts              # Main exports
├── types.ts              # TypeScript interfaces
├── client.ts             # Base client class
├── fallback.ts           # Fallback strategy
├── cache.ts              # Caching layer
├── retry.ts              # Retry logic
├── config.ts             # Configuration loader
└── providers/
    ├── open-api.ts       # eCourts Open API
    ├── ecourtsindia.ts   # eCourtsIndia API
    └── scraper.ts        # Legacy fallback
```

### Files to Update
```
app/api/case-status/route.ts       # Update to use new client
lib/case-status-fetchers/index.ts  # Update fetcher functions
.env.local                         # Add new API keys
```

---

## 🔐 Authentication

### Environment Variables

```bash
# .env.local

# Primary: eCourts Open API (recommended)
ECOURTS_OPEN_API_KEY=eci_live_XXXXXXXXXXXXXXXXXXXXXXXX
ECOURTS_OPEN_DEPARTMENT_ID=DEPT_XXXXX

# Secondary: eCourtsIndia API
ECOURTSINDIA_API_KEY=ei_live_XXXXXXXXXXXXXXXXXXXXXXXX

# Feature flags
ENABLE_OFFICIAL_API=true
ENABLE_FALLBACK_SCRAPER=true

# Cache
API_CACHE_TTL=86400
```

---

## 📈 Expected Improvements

| Metric | Before | After |
|--------|--------|-------|
| Success Rate | 60-70% | 99%+ |
| Response Time | 15-30s | <1s |
| Maintenance Hours/Week | 10-20 | 0-1 |
| Legal Risk | Medium | None |
| Cost Predictability | Poor | Excellent |

---

## ⚠️ Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scraper breaks suddenly | High | Have official API ready |
| Open API rejected | Medium | Use eCourtsIndia as backup |
| Cost overrun | Low | Implement caching + monitoring |
| Data format differences | Low | Comprehensive testing |

---

## 📞 Support & Resources

### Official Contacts
- **eCourts Open API**: support@bharatapi.gov.in
- **eCourtsIndia**: api-support@ecourtsindia.com

### LexRam Internal
- Current API: `/case-status-fetcher-documentation/api-reference.md`
- Scraper Details: `ECOURTS_DETAILED_SCRAPER.md`

---

## ✅ Next Steps

1. **Read** the full documentation:
   - [Official API Details](./OFFICIAL_ECOURTS_API_ALTERNATIVES.md)
   - [Comparison Matrix](./OFFICIAL_VS_UNOFFICIAL_API_COMPARISON.md)
   - [Code Guide](./API_MIGRATION_CODE_GUIDE.md)

2. **Register** for APIs:
   - [eCourtsIndia](https://ecourtsindia.com/api) (instant)
   - [eCourts Open](https://bharatapi.gov.in) (4-6 weeks)

3. **Implement** the migration following the code guide

4. **Test** thoroughly before production rollout

---

*Last Updated: March 2026*  
*LexRam 2.0 Legal AI Platform*
