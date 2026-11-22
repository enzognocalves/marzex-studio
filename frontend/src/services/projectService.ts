import { supabase } from '../supabase';

export interface PatternData {
  id?: number;
  track_id?: number;
  name: string;
  start_bar: number;
  length_bars: number;
  step_data: unknown;
}

export interface TrackData {
  id?: number;
  project_id?: number;
  name: string;
  track_type: string;
  volume: number;
  pan: number;
  is_muted: boolean;
  is_solo: boolean;
  sort_order: number;
  patterns?: PatternData[];
}

export interface ProjectData {
  id?: number;
  user_id?: string | null;
  title: string;
  bpm: number;
  time_signature: string;
  musical_key: string;
  ui_theme: string;
  updated_at?: string;
  tracks?: TrackData[];
}

// 1. Criar um novo projeto
export async function createProject(project: {
  title: string;
  bpm?: number;
  time_signature?: string;
  musical_key?: string;
  ui_theme?: string;
}) {
  const { data, error } = await supabase
    .from('projects')
    .insert([
      {
        title: project.title,
        bpm: project.bpm ?? 128,
        time_signature: project.time_signature ?? '4/4',
        musical_key: project.musical_key ?? 'C Minor',
        ui_theme: project.ui_theme ?? 'light',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as ProjectData;
}

// 2. Listar todos os projetos (com tracks e patterns)
export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*, tracks(*, patterns(*))')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ProjectData[];
}

// 3. Buscar um projeto específico pelo ID
export async function getProjectById(projectId: number) {
  const { data, error } = await supabase
    .from('projects')
    .select('*, tracks(*, patterns(*))')
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return data as ProjectData;
}

// 4. Atualizar dados de um projeto existente (ex: título, BPM, tom)
export async function updateProject(
  projectId: number,
  updates: Partial<Pick<ProjectData, 'title' | 'bpm' | 'time_signature' | 'musical_key' | 'ui_theme'>>
) {
  const { data, error } = await supabase
    .from('projects')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data as ProjectData;
}

// 5. Salvar uma faixa (track) dentro de um projeto
export async function saveTrack(track: TrackData) {
  const { data, error } = await supabase
    .from('tracks')
    .upsert([
      {
        ...(track.id ? { id: track.id } : {}),
        project_id: track.project_id,
        name: track.name,
        track_type: track.track_type,
        volume: track.volume,
        pan: track.pan,
        is_muted: track.is_muted,
        is_solo: track.is_solo,
        sort_order: track.sort_order,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as TrackData;
}

// 6. Salvar um pattern (notas / steps do sequencer) dentro de uma faixa
export async function savePattern(pattern: PatternData) {
  const { data, error } = await supabase
    .from('patterns')
    .upsert([
      {
        ...(pattern.id ? { id: pattern.id } : {}),
        track_id: pattern.track_id,
        name: pattern.name,
        start_bar: pattern.start_bar,
        length_bars: pattern.length_bars,
        step_data: pattern.step_data,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as PatternData;
}

// 7. Apagar um projeto
export async function deleteProject(projectId: number) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
}