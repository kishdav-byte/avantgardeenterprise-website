# Meal Planner Tool Integration - Implementation Guide

## 🎯 Overview

The AI Meal Planner tool has been integrated into the avant-garde Enterprise website as a beta feature with the following characteristics:

- ✅ **Authentication Required**: Users must sign in to access
- ✅ **Beta Status**: Clearly marked as beta with free access during testing
- ✅ **Usage Limits**: 50 requests/month for regular users
- ✅ **Admin Unlimited**: Admin accounts have unlimited access
- ✅ **Easy Rebranding**: Centralized configuration for name changes
- ✅ **Subscription Ready**: Database structure prepared for future paid tiers

## 📁 Files Created

### Database & Configuration
1. **`setup_meal_planner.sql`** - Database schema with tables for:
   - `meal_planner_usage` - Track API calls and enforce limits
   - `meal_planner_favorites` - User-saved recipes
   - `meal_planner_subscriptions` - Beta/subscription management
   - Functions for quota checking and stats

2. **`lib/meal-planner-config.ts`** - Centralized branding configuration
   - Tool name, tagline, description
   - UI text and messages
   - Feature flags
   - **Change the name here to rebrand the entire tool**

3. **`lib/meal-planner-types.ts`** - TypeScript type definitions

### Frontend Components
4. **`components/sections/IntelligentTools.tsx`** - Homepage showcase section
5. **`app/tools/meal-planner/page.tsx`** - Main authenticated page
6. **`components/meal-planner/MealPlannerApp.tsx`** - App container
7. **`components/meal-planner/MealPlannerLanding.tsx`** - Action selection screen
8. **`components/meal-planner/MealPlannerMain.tsx`** - Placeholder (needs porting)
9. **`components/meal-planner/RecipeFinder.tsx`** - Placeholder (needs porting)
10. **`components/meal-planner/FavoritesView.tsx`** - Placeholder (needs porting)

### Backend
11. **`app/api/meal-planner/route.ts`** - API endpoint with:
    - Authentication checking
    - Quota enforcement (admin bypass)
    - Gemini API integration
    - Usage logging
    - GET endpoint for stats

### Homepage Integration
12. **`app/page.tsx`** - Updated to include IntelligentTools section

## 🚀 Setup Instructions

### 1. Database Setup
Run the SQL script in your Supabase SQL Editor:
```bash
# Copy contents of setup_meal_planner.sql and run in Supabase
```

### 2. Environment Variables
Add to your `.env.local`:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

**Note**: The API uses:
- `gpt-4o` when images are uploaded (for vision analysis)
- `gpt-4o-mini` for text-only requests (faster and cheaper)

### 3. Install Dependencies (if needed)
The existing dependencies should cover everything, but verify:
```bash
npm install
```

### 4. Test the Integration
```bash
npm run dev
```

Visit:
- Homepage: `http://localhost:3000` - See the Intelligent Tools section
- Tool directly: `http://localhost:3000/tools/meal-planner`

## 🔐 Authentication & Permissions

### User Flow
1. User visits `/tools/meal-planner`
2. If not logged in → Redirected to login page
3. If logged in → Check quota
4. If quota available → Show app
5. If quota exceeded → Show limit message

### Admin Privileges
Admin users (where `clients.role = 'admin'`) get:
- ✅ Unlimited requests (no monthly limit)
- ✅ "Admin - Unlimited" badge
- ✅ Stats show ∞ for monthly limit

### Making a User Admin
Run in Supabase SQL Editor:
```sql
UPDATE public.clients 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

## 🎨 Rebranding the Tool

To change the name from "AI Meal Planner" to something else:

### Option 1: Quick Name Change
Edit `/lib/meal-planner-config.ts`:
```typescript
export const MEAL_PLANNER_CONFIG = {
  name: "Your New Name Here",
  shortName: "New Name",
  tagline: "Your new tagline",
  // ... rest stays the same
}
```

### Option 2: Complete Rebrand
1. Update `meal-planner-config.ts` with all new text
2. Update icon in `IntelligentTools.tsx` (line 18)
3. Optionally rename files/folders (not required)

## 📊 Usage Tracking

### How It Works
- Every API call is logged in `meal_planner_usage`
- Monthly quota is checked via `check_meal_planner_quota()` function
- Admin users bypass quota check
- Stats available via GET `/api/meal-planner`

### Viewing Usage Stats
```sql
-- See all usage for a user
SELECT * FROM meal_planner_usage 
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC;

-- Get current stats
SELECT * FROM get_meal_planner_stats('user-uuid-here');
```

## 🔄 Next Steps - Completing the Integration

### Phase 1: Port ButlerAI Components (Priority)
The following components need to be ported from `/ButlerAI.ai/components/`:

1. **ImageUploader.tsx** → Adapt for inventory upload
2. **MealCalendar.tsx** → Weekly meal scheduling
3. **PreferenceSelector.tsx** → Dietary/cuisine preferences
4. **MealPlanDisplay.tsx** → Show generated meal plans
5. **SingleRecipeFinder.tsx** → Recipe search interface
6. **FavoritesPage.tsx** → Saved recipes view

**Styling Updates Needed:**
- Replace Tailwind classes with avant-garde theme
- Use `bg-white/5`, `border-white/10`, `text-accent` patterns
- Add `font-black uppercase tracking-tighter` for headings
- Implement hover effects with `group` classes

### Phase 2: API Integration
Update the API route to properly handle:
- Image uploads (convert to base64 for Gemini)
- Meal plan generation
- Recipe finding
- Error handling

### Phase 3: Favorites System
Implement favorites with Supabase:
```typescript
// Save favorite
await supabase.from('meal_planner_favorites').insert({
  user_id: userId,
  recipe_name: recipe.name,
  ingredients: recipe.ingredients,
  instructions: recipe.instructions
})

// Load favorites
const { data } = await supabase
  .from('meal_planner_favorites')
  .select('*')
  .eq('user_id', userId)
```

### Phase 4: Subscription Management (Future)
When ready to add paid tiers:
1. Update `meal_planner_subscriptions` table
2. Add Stripe integration
3. Create subscription management UI
4. Update quota limits based on tier

## 🎯 Current Status

### ✅ Completed
- Database schema with RLS policies
- Authentication & authorization
- Admin unlimited access
- Usage tracking & quota system
- Homepage integration with Intelligent Tools section
- Landing page with action cards
- Beta status indicators
- Centralized configuration for rebranding
- API route structure with Gemini integration

### 🚧 In Progress (Placeholders Created)
- Main meal planner interface
- Recipe finder
- Favorites view

### 📋 To Do
- Port and adapt ButlerAI components
- Style components with avant-garde theme
- Test image upload functionality
- Implement favorites CRUD operations
- Add loading states and error handling
- Create admin dashboard for usage analytics

## 🔧 Troubleshooting

### "Authentication Required" even when logged in
- Check that Supabase session is valid
- Verify `.env.local` has correct Supabase credentials
- Check browser console for errors

### "Monthly limit reached" for admin
- Verify user role in database: `SELECT role FROM clients WHERE email = 'admin@email.com'`
- Should return `'admin'`
- Check `check_meal_planner_quota` function is working

### API errors
- Verify `GEMINI_API_KEY` is set in `.env.local`
- Check Supabase RLS policies allow authenticated users
- Review API route logs in terminal

## 📞 Support

For issues or questions:
1. Check the configuration in `meal-planner-config.ts`
2. Review database setup in `setup_meal_planner.sql`
3. Verify environment variables
4. Check Supabase logs for RLS policy issues

---

**Last Updated**: 2026-02-07
**Status**: Foundation Complete - Ready for Component Porting
