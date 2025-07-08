import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface UserStats {
  totalDownloads: number;
  totalNotesUploaded: number;
  totalViews: number;
  totalWishlisted: number;
  studyStreak: number;
  lastStudyDate: string | null;
  averageStudyTime: number;
  mostStudiedSubjects: { subject: string; count: number }[];
}

interface StatsState {
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  fetchStats: (userId: string) => Promise<void>;
}

export const useStatsStore = create<StatsState>()((set) => ({
  stats: null,
  isLoading: false,
  error: null,

  fetchStats: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Get total downloads
      const { data: downloads, error: downloadsError } = await supabase
        .from('downloads')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      if (downloadsError) throw downloadsError;

      // Get total notes uploaded
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('id, views', { count: 'exact' })
        .eq('uploader_id', userId);

      if (notesError) throw notesError;

      // Get total wishlisted notes
      const { data: wishlisted, error: wishlistError } = await supabase
        .from('wishlists')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      if (wishlistError) throw wishlistError;

      // Calculate total views
      const totalViews = notes?.reduce((sum, note) => sum + (note.views || 0), 0) || 0;

      // Get study streak and history
      const { data: studyHistory, error: studyError } = await supabase
        .from('downloads')
        .select('downloaded_at, note_id')
        .eq('user_id', userId)
        .order('downloaded_at', { ascending: false });

      if (studyError) throw studyError;

      // Calculate study streak
      let streak = 0;
      let lastDate = null;
      if (studyHistory && studyHistory.length > 0) {
        lastDate = new Date(studyHistory[0].downloaded_at).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        
        if (lastDate === today) {
          streak = 1;
          for (let i = 1; i < studyHistory.length; i++) {
            const currentDate = new Date(studyHistory[i].downloaded_at).toISOString().split('T')[0];
            const prevDate = new Date(studyHistory[i - 1].downloaded_at).toISOString().split('T')[0];
            
            if (new Date(currentDate).getTime() + 86400000 === new Date(prevDate).getTime()) {
              streak++;
            } 
          }
        }
      }

      // Get most studied subjects
      const { data: subjects, error: subjectsError } = await supabase
        .from('notes')
        .select('subject')
        .in('id', studyHistory?.map(h => h.note_id) || []);

      if (subjectsError) throw subjectsError;

      const subjectCounts = subjects?.reduce((acc, { subject }) => {
        acc[subject] = (acc[subject] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const mostStudiedSubjects = Object.entries(subjectCounts)
        .map(([subject, count]) => ({ subject, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      set({
        stats: {
          totalDownloads: downloads?.length || 0,
          totalNotesUploaded: notes?.length || 0,
          totalViews,
          totalWishlisted: wishlisted?.length || 0,
          studyStreak: streak,
          lastStudyDate: lastDate,
          averageStudyTime: studyHistory?.length ? 
            studyHistory.length / (new Set(studyHistory.map(h => 
              new Date(h.downloaded_at).toISOString().split('T')[0]
            )).size) : 0,
          mostStudiedSubjects,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
        isLoading: false 
      });
    }
  }
}));
