export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  icon: string;
  description: string;
  resource_count: number;
}

export interface Resource {
  id: number;
  category_id: number;
  category_name: string;
  category_slug: string;
  category_icon: string;
  name: string;
  url: string;
  description: string;
  usage_context: string;
  input_output: string;
  opsec_notes: string;
  tool_flags: string; // T, D, R, M
  is_free: number; // 1 = Free, 0 = Paid, 2 = Freemium
  rating_avg: number;
  rating_count: number;
  views: number;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export interface FilterState {
  category: string;
  q: string;
  tag: string;
  type: string; // T, D, R, M or ''
  cost: string; // 'all' | 'free' | 'freemium' | 'paid'
  sort: string; // 'views' | 'rating' | 'name_asc' | 'newest'
  bookmarkedOnly: boolean;
}

export interface AdminStats {
  totalResources: number;
  totalCategories: number;
  totalViews: number;
  avgRating: number;
  topCategories: { name: string; count: number }[];
  mostViewed: { id: number; name: string; views: number; rating_avg: number; tool_flags: string }[];
  flagsDistribution: {
    tools: number;
    dorks: number;
    registration: number;
    manual: number;
  };
}

export interface AuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  details: string;
  ip_address: string;
  created_at: string;
}
