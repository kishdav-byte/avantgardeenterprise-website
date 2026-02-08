# 🚀 Vercel Deployment Checklist

## Pre-Deployment Steps

### 1. ✅ Code Ready
- [x] All components tested locally
- [x] No compilation errors
- [x] Navigation flow verified
- [x] Authentication working

### 2. Database Setup (Supabase)
Run this SQL in your Supabase SQL Editor:

```sql
-- Copy entire contents of setup_meal_planner.sql
-- This creates:
-- - meal_planner_usage table
-- - meal_planner_favorites table  
-- - meal_planner_subscriptions table
-- - check_meal_planner_quota() function
-- - get_meal_planner_stats() function
```

**File**: `setup_meal_planner.sql`

### 3. Environment Variables (Vercel)
Add these to your Vercel project settings:

```bash
# Supabase (should already exist)
NEXT_PUBLIC_SUPABASE_URL=https://dxjbtbkeviahpdgbpjlt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI (NEW - add this)
OPENAI_API_KEY=sk-proj-KV1bQvqZtcVc-723xEjzhiLOKmKNFgLWa_LS5ZwZ...
```

---

## Deployment Steps

### Option 1: Git Push (Recommended)
```bash
cd /Users/davidkish/Desktop/avant-garde\ Enterprise/website
git add .
git commit -m "Add AI Meal Planner tool with OpenAI integration"
git push origin main
```

Vercel will automatically deploy.

### Option 2: Vercel CLI
```bash
cd /Users/davidkish/Desktop/avant-garde\ Enterprise/website
vercel --prod
```

---

## Post-Deployment Verification

### 1. Check Deployment
- [ ] Visit your Vercel URL
- [ ] Verify homepage loads
- [ ] Scroll to Intelligent Tools section
- [ ] Confirm AI Meal Planner card is visible

### 2. Test Navigation
- [ ] Click on AI Meal Planner card
- [ ] Verify redirect to `/tools/meal-planner`
- [ ] Confirm authentication required page shows
- [ ] Click "SIGN IN / SIGN UP"
- [ ] Verify login page loads

### 3. Test with Authentication
- [ ] Sign in with your admin account
- [ ] Navigate to `/tools/meal-planner`
- [ ] Verify landing page with 4 action cards shows
- [ ] Confirm usage stats display (should show "Unlimited" for admin)

### 4. Test Meal Planning Flow
- [ ] Click "Upload Inventory" card
- [ ] Verify image uploaders appear
- [ ] Try uploading an image (or bypass)
- [ ] Select meals on calendar
- [ ] Set preferences
- [ ] Click "Generate My Meal Plan"
- [ ] Verify AI generates a meal plan
- [ ] Check shopping list appears

### 5. Verify Admin Features
- [ ] Confirm "Admin - Unlimited" badge shows
- [ ] Verify no quota limits
- [ ] Test multiple generations (should not hit limit)

---

## Troubleshooting

### Issue: "OPENAI_API_KEY is not set"
**Solution**: Add the environment variable in Vercel settings, then redeploy

### Issue: Database errors
**Solution**: Run `setup_meal_planner.sql` in Supabase SQL Editor

### Issue: Authentication not working
**Solution**: Verify Supabase environment variables are set in Vercel

### Issue: Images not uploading
**Solution**: Check Vercel function timeout settings (may need to increase)

---

## Files to Review Before Deployment

### Documentation
- `MEAL_PLANNER_INTEGRATION.md` - Full technical guide
- `MEAL_PLANNER_SUMMARY.md` - Executive summary
- `MEAL_PLANNER_TEST_RESULTS.md` - Test results

### Database
- `setup_meal_planner.sql` - Database schema

### Configuration
- `lib/meal-planner-config.ts` - Branding & settings
- `lib/meal-planner-types.ts` - TypeScript types

### Components
- `components/meal-planner/` - All meal planner components
- `components/sections/IntelligentTools.tsx` - Homepage section
- `app/tools/meal-planner/page.tsx` - Main page
- `app/api/meal-planner/route.ts` - API endpoint

---

## Quick Deploy Command

```bash
# From website directory
git add . && git commit -m "Add AI Meal Planner" && git push origin main
```

---

## Success Criteria

Deployment is successful when:
- ✅ Homepage shows Intelligent Tools section
- ✅ AI Meal Planner card is clickable
- ✅ Authentication protection works
- ✅ Logged-in users can access the tool
- ✅ Admin users see unlimited access
- ✅ AI generation produces meal plans
- ✅ No console errors

---

**Ready to deploy!** 🚀
