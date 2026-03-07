import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  level: string;
  is_premium: boolean;
  is_verified: boolean;
  tasks_today: number;
  tasks_completed_total: number;
  pix_key: string;
  is_community_member: boolean;
};

export type Job = {
  id: string;
  category: string;
  type: string;
  company: string;
  title: string;
  value: number;
  logo_url: string;
  level_required: number;
  currency: string;
  duration: string;
  description: string;
  briefing: any;
  steps: any[];
  evidence_config: any;
  job_data: any;
};
