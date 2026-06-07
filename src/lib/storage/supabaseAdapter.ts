import type { SupabaseClient } from '@supabase/supabase-js';
import type { Branch, CampPhase, NewBranch, NewReport, Report } from '@/types';
import type { StorageAdapter } from './types';

/** המרת שורת DB (snake_case) לאובייקט אפליקציה (camelCase). */
function rowToBranch(r: Record<string, unknown>): Branch {
  return {
    id: r.id as string,
    name: r.name as string,
    region: r.region as string,
    camp: (r.camp as string | undefined) ?? undefined,
    phone: (r.phone as string | undefined) ?? undefined,
    createdAt: r.created_at as string,
  };
}

function rowToReport(r: Record<string, unknown>): Report {
  return {
    id: r.id as string,
    branchId: r.branch_id as string,
    coordinatorName: r.coordinator_name as string,
    headcount: (r.headcount as number | null) ?? null,
    campPhase: (r.camp_phase as CampPhase | null) ?? undefined,
    attendance: (r.attendance as Record<string, number> | null) ?? undefined,
    message: (r.message as string) ?? '',
    createdAt: r.created_at as string,
  };
}

/**
 * מימוש אחסון מול Supabase (Postgres + Realtime).
 */
export class SupabaseAdapter implements StorageAdapter {
  readonly mode = 'supabase' as const;
  constructor(private client: SupabaseClient) {}

  async listBranches(): Promise<Branch[]> {
    const { data, error } = await this.client
      .from('branches')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToBranch);
  }

  async createBranch(input: NewBranch): Promise<Branch> {
    const { data, error } = await this.client
      .from('branches')
      .insert({ name: input.name, region: input.region, camp: input.camp, phone: input.phone })
      .select()
      .single();
    if (error) throw error;
    return rowToBranch(data);
  }

  async updateBranch(id: string, patch: Partial<NewBranch>): Promise<Branch> {
    const updated: Record<string, unknown> = {};
    if (patch.name !== undefined) updated.name = patch.name;
    if (patch.region !== undefined) updated.region = patch.region;
    if (patch.camp !== undefined) updated.camp = patch.camp;
    if (patch.phone !== undefined) updated.phone = patch.phone;
    const { data, error } = await this.client
      .from('branches')
      .update(updated)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return rowToBranch(data);
  }

  async deleteBranch(id: string): Promise<void> {
    const { error } = await this.client.from('branches').delete().eq('id', id);
    if (error) throw error;
  }

  async listReports(): Promise<Report[]> {
    const { data, error } = await this.client
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToReport);
  }

  async createReport(input: NewReport): Promise<Report> {
    const base = {
      branch_id: input.branchId,
      coordinator_name: input.coordinatorName,
      status: 'ok',
      headcount: input.headcount,
      message: input.message,
    };
    // ניסיון ראשון עם העמודות החדשות; אם הן טרם נוספו (לפני מיגרציה 0004) — נופלים לבסיסי.
    let { data, error } = await this.client
      .from('reports')
      .insert({ ...base, camp_phase: input.campPhase ?? null, attendance: input.attendance ?? null })
      .select()
      .single();
    if (error && /camp_phase|attendance|column|schema/i.test(error.message)) {
      ({ data, error } = await this.client.from('reports').insert(base).select().single());
    }
    if (error) throw error;
    return rowToReport(data);
  }

  async getCampPhase(): Promise<CampPhase> {
    // עמיד לכך שטבלת settings טרם נוצרה (לפני מיגרציה 0004).
    try {
      const { data, error } = await this.client
        .from('settings')
        .select('value')
        .eq('key', 'camp_phase')
        .maybeSingle();
      if (error) return 'shachbag';
      return data?.value === 'shachbatz' ? 'shachbatz' : 'shachbag';
    } catch {
      return 'shachbag';
    }
  }

  async setCampPhase(phase: CampPhase): Promise<void> {
    const { error } = await this.client
      .from('settings')
      .upsert({ key: 'camp_phase', value: phase }, { onConflict: 'key' });
    if (error) throw error;
  }

  subscribe(onChange: () => void): () => void {
    const channel = this.client
      .channel('doch1-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'branches' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, onChange)
      .subscribe();
    return () => {
      this.client.removeChannel(channel);
    };
  }
}
