/**
 * Space Planner Micro-SaaS Type Definitions (Phase 1)
 * 
 * Core domain types for AI-powered space and room organization planner:
 * - Home & Classroom Contexts
 * - Credit System (Free Sample + Pay-Per-Room)
 * - Multimodal Audit Inputs & Lifestyle Metrics
 * - Structured Multimodal AI Output (Phased Steps, Mockups, Amazon Recommendations)
 */

// =============================================================================
// 1. SPACE CONTEXT & ROOM TAXONOMY
// =============================================================================

export type SpaceContext = 'home' | 'classroom' | 'business';

export type HomeRoomType =
    | 'living_room'
    | 'kitchen_pantry'
    | 'primary_bedroom'
    | 'kids_bedroom'
    | 'closet_walk_in'
    | 'closet_reach_in'
    | 'garage'
    | 'home_office'
    | 'bathroom'
    | 'playroom'
    | 'laundry_mudroom'
    | 'attic_basement'
    | 'entryway'
    | 'other';

export type ClassroomRoomType =
    | 'elementary_general'
    | 'preschool_kindergarten'
    | 'stem_science_lab'
    | 'reading_nook_library'
    | 'art_studio'
    | 'music_performance'
    | 'special_ed_sensory'
    | 'teacher_lounge_prep'
    | 'classroom_supply_closet'
    | 'makerspace'
    | 'other';

export type BusinessRoomType =
    | 'retail_sales_floor'
    | 'warehouse_fulfillment'
    | 'commercial_office'
    | 'breakroom_kitchen'
    | 'conference_meeting_room'
    | 'restaurant_kitchen_pantry'
    | 'clinic_treatment_room'
    | 'workshop_production'
    | 'supply_storage_room'
    | 'reception_front_desk'
    | 'other';

export type RoomType = HomeRoomType | ClassroomRoomType | BusinessRoomType;

export type OrganizationGoal =
    | 'organize_categorize'
    | 'minimize_declutter'
    | 'aesthetic_enhancement'
    | 'child_student_safety'
    | 'traffic_flow_ergonomics'
    | 'storage_density_maximization'
    | 'learning_station_zones'
    | 'daily_routine_efficiency'
    | 'compliance_safety_readiness'
    | 'inventory_access_speed';

export type BudgetTier = 'diy_low' | 'medium' | 'high' | 'open';

// =============================================================================
// 2. LIFESTYLE & ENVIRONMENT METRICS
// =============================================================================

export interface HomeLifestyleMetrics {
    family_size: number;
    has_pets: boolean;
    pet_types?: string[];
    age_groups: ('infant' | 'toddler' | 'school_age' | 'teen' | 'adult' | 'senior')[];
    primary_usage: string; // e.g., "Family gathering & Remote work", "High-volume cooking"
    pain_points?: string[]; // e.g., "Overflowing shelves", "Piles of clothing", "Lost keys"
    desired_aesthetic?: 'minimalist' | 'cozy_functional' | 'industrial' | 'modern_clean';
    maintenance_time_preference?: 'ultra_low_5min' | 'standard_15min' | 'flexible';
}

export interface ClassroomLifestyleMetrics {
    student_count: number;
    grade_level: string; // e.g., "Pre-K", "1st Grade", "Middle School (6-8)", "High School"
    subject_focus?: string; // e.g., "General", "STEM", "Literature & Reading", "Special Ed"
    accessibility_needs: boolean;
    sensory_needs: boolean;
    seating_layout?: 'collaborative_pods' | 'u_shape' | 'flexible_stations' | 'traditional_rows';
    structural_constraints?: string[]; // e.g., "No drill / adhesive only", "Shared room", "No built-in storage"
    daily_transition_count?: number; // Number of classroom transitions or student rotations per day
}

export interface BusinessLifestyleMetrics {
    employee_headcount: number;
    daily_foot_traffic: 'internal_only_low' | 'moderate_client_facing' | 'high_retail_volume' | 'heavy_industrial_rush';
    compliance_requirements?: ('osha_general' | 'health_code_food_safety' | 'ada_accessibility' | 'fire_code_clearance' | 'hipaa_privacy' | 'none')[];
    storage_turnover_frequency: 'daily_rapid' | 'weekly_restock' | 'monthly_seasonal' | 'long_term_archive';
    industry_type?: string; // e.g., "Retail / Boutique", "Healthcare Clinic", "Tech Office", "Restaurant / Food Service", "Automotive / Trades"
    primary_pain_points?: string[]; // e.g., "Lost tools/supplies", "Tripping/safety hazards", "Unprofessional presentation", "Slow order prep"
    inventory_tracking_method?: 'digital_barcode' | 'manual_spreadsheet' | 'visual_bins' | 'none';
}

export type LifestyleMetrics = HomeLifestyleMetrics | ClassroomLifestyleMetrics | BusinessLifestyleMetrics;

// =============================================================================
// 3. AUDIT & INPUT MODELS
// =============================================================================

export type AuditStatus = 'draft' | 'queued' | 'processing' | 'completed' | 'failed';

export interface SpaceAudit {
    id: string;
    user_id: string;
    space_context: SpaceContext;
    room_type: RoomType;
    title?: string;
    goals: OrganizationGoal[];
    budget_tier: BudgetTier;
    budget_limit?: number;
    lifestyle_metrics: LifestyleMetrics;
    clutter_photos: string[]; // Supabase storage paths or public URLs
    status: AuditStatus;
    is_free_sample: boolean;
    error_message?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateAuditInput {
    space_context: SpaceContext;
    room_type: RoomType;
    title?: string;
    goals: OrganizationGoal[];
    budget_tier: BudgetTier;
    budget_limit?: number;
    lifestyle_metrics: LifestyleMetrics;
    clutter_photos: string[];
}

export interface UpdateAuditInput {
    title?: string;
    goals?: OrganizationGoal[];
    budget_tier?: BudgetTier;
    budget_limit?: number;
    lifestyle_metrics?: Partial<LifestyleMetrics>;
    clutter_photos?: string[];
    status?: AuditStatus;
}

// =============================================================================
// 4. STRUCTURED AI OUTPUT (PHASED STEPS, MOCKUPS & PRODUCTS)
// =============================================================================

export interface PhasedStep {
    step_number: number;
    title?: string;
    action?: string;
    instruction?: string;
    zone?: string;
    estimated_minutes?: number;
    tools_or_materials_needed?: string[];
    tips?: string;
    pro_tip?: string;
}

export interface OrganizationPhase {
    phase_number: number;
    phase_title?: string; // e.g., "Phase 1: Rapid Purge & Zone Sorting"
    title?: string;
    phase_objective?: string;
    description?: string;
    estimated_duration_minutes?: number;
    time_estimate_minutes?: number;
    priority?: string;
    steps: PhasedStep[];
}

export type ProductPriority = 'must_have' | 'recommended' | 'optional_upgrade' | 'optional';

export interface AmazonProductRecommendation {
    id?: string;
    title: string;
    category: string; // e.g., "Clear Acrylic Storage Bins", "Heavy-Duty Utility Cart"
    rationale?: string; // Tailored explanation of why this specific item resolves clutter
    reasoning?: string;
    search_query?: string; // Amazon search keywords
    asin?: string; // Amazon standard ID if matched
    affiliate_url: string; // Tagged affiliate link
    estimated_price_usd?: number;
    price_estimate?: number;
    priority: ProductPriority;
    placement_zone: string; // e.g., "Middle open cubby", "Under-desk rollout"
    dimensions_guide?: string; // e.g., "12\" x 10\" x 6\""
    image_url?: string;
}

export type ProductRecommendation = AmazonProductRecommendation;

export interface SpaceDiagnosticMetrics {
    estimated_space_reclaimed_pct: number;
    clutter_severity_score: number; // 0 (pristine) - 100 (severe hoarding/clutter)
    organization_readiness_score: number; // 0 - 100
    maintenance_difficulty: 'low' | 'moderate' | 'high';
    estimated_total_time_hours: number;
}

export interface SpaceAuditResult {
    id: string;
    audit_id: string;
    user_id: string;
    executive_summary: string;
    key_pain_points: string[];
    phases?: OrganizationPhase[];
    phased_steps?: PhasedStep[];
    visual_mockup_url?: string;
    visual_mockup_prompt?: string;
    product_recommendations: AmazonProductRecommendation[];
    space_metrics?: SpaceDiagnosticMetrics;
    created_at: string;
    updated_at?: string;
}

// =============================================================================
// 5. CREDIT & MONETIZATION SYSTEM
// =============================================================================

export interface SpacePlannerCredits {
    id: string;
    user_id: string;
    balance: number; // Remaining audits available
    free_sample_used: boolean;
    lifetime_granted: number;
    lifetime_used: number;
    created_at: string;
    updated_at: string;
}

export type CreditTransactionType =
    | 'free_grant'
    | 'purchase'
    | 'audit_deduction'
    | 'refund'
    | 'admin_adjustment';

export interface SpacePlannerTransaction {
    id: string;
    user_id: string;
    amount: number;
    balance_after: number;
    transaction_type: CreditTransactionType;
    description: string;
    audit_id?: string;
    stripe_session_id?: string;
    metadata?: Record<string, any>;
    created_at: string;
}

export type CreditPackageId = 'single' | 'standard_3' | 'power_8' | string;

export interface CreditPackage {
    id: CreditPackageId;
    name: string;
    description?: string;
    credits: number;
    price_cents: number;
    price: number;
    price_display: string;
    unit_price_display: string;
    badge?: string;
    popular?: boolean;
    isPopular?: boolean;
    isBestValue?: boolean;
}

// Standard micro-SaaS Pay-Per-Room packages
export const SPACE_PLANNER_CREDIT_PACKAGES: CreditPackage[] = [
    {
        id: 'single',
        name: 'Single Room Audit',
        description: 'Single room assessment with full action plan',
        credits: 1,
        price_cents: 900, // $9.00
        price: 9,
        price_display: '$9',
        unit_price_display: '$9.00 / room',
    },
    {
        id: 'standard_3',
        name: '3-Room Project Pack',
        description: 'Ideal for multi-room revamps or classroom zones',
        credits: 3,
        price_cents: 1900, // $19.00 ($6.33 / room)
        price: 19,
        price_display: '$19',
        unit_price_display: '$6.33 / room',
        badge: 'Save 30%',
        popular: true,
        isPopular: true,
    },
    {
        id: 'power_8',
        name: '8-Room Whole-Facility Pack',
        description: 'Whole-facility, entire school wing, or whole-home makeover',
        credits: 8,
        price_cents: 3900, // $39.00 ($4.88 / room)
        price: 39,
        price_display: '$39',
        unit_price_display: '$4.88 / room',
        badge: 'Best Value • Save 46%',
        isBestValue: true,
    },
];

// =============================================================================
// 6. API REQUEST / RESPONSE CONTRACTS
// =============================================================================

export interface DeductCreditResponse {
    success: boolean;
    balance: number;
    is_free_sample: boolean;
    error?: string;
}

export interface AuditGenerationPayload {
    audit_id: string;
    space_context: SpaceContext;
    room_type: RoomType;
    goals: OrganizationGoal[];
    budget_tier: BudgetTier;
    budget_limit?: number;
    lifestyle_metrics: LifestyleMetrics;
    clutter_photo_urls: string[];
}

export interface AuditApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}
