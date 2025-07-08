export interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  target_url: string | null;
  placement: 'banner' | 'interstitial' | 'native';
  status: 'active' | 'inactive' | 'archived';
  start_date: string | null;
  end_date: string | null;
  target_subjects: string[] | null;
  target_classes: string[] | null;

  created_at: string;
  updated_at: string;
}

export interface AdImpression {
  id: string;
  ad_id: string;
  user_id: string | null;
  note_id: string | null;
  impression_type: 'view' | 'click';
  created_at: string;
}
