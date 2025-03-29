interface QuestConfig {
  id: string;
  config_version: number;
  starts_at: string;
  expires_at: string;
  features: number[];
  experiments: {
    rollout: string;
    targeting: string | null;
    preview: string | null;
  };
  application: {
    link: string;
    id: string;
    name: string;
  };
  assets: {
    hero: string;
    hero_video: string | null;
    quest_bar_hero: string;
    quest_bar_hero_video: string | null;
    game_tile: string;
    logotype: string;
  };
  colors: {
    primary: string;
    secondary: string;
  };
  messages: {
    quest_name: string;
    game_title: string;
    game_publisher: string;
  };
  task_config: {
    type: number;
    join_operator: string;
    tasks: {
      [key: string]: {
        event_name: string;
        target: number;
        external_ids?: string[];
        title?: string;
        description?: string;
      };
    };
    enrollment_url?: string;
    developer_application_id?: string;
  };
  rewards_config: {
    assignment_method: number;
    rewards: {
      type: number;
      sku_id: string;
      asset: string;
      asset_video: string | null;
      messages: {
        name: string;
        name_with_article: string;
        redemption_instructions_by_platform: {
          [key: string]: string;
        };
      };
      expires_at?: string;
      expires_at_premium?: string | null;
      expiration_mode?: number;
      approximate_count?: number | null;
      redemption_link?: string | null;
    }[];
    rewards_expire_at: string;
    platforms: number[];
  };
  video_metadata?: {
    messages: {
      video_title: string;
      video_end_cta_title: string;
      video_end_cta_subtitle: string;
      video_end_cta_button_label: string;
    };
    assets: {
      video_player_video_hls: string | null;
      video_player_video: string;
      video_player_thumbnail: string;
      video_player_video_low_res: string;
      video_player_caption: string;
      video_player_transcript: string;
      quest_bar_preview_video: string;
      quest_bar_preview_thumbnail: string;
      quest_home_video: string;
    };
  };
}

export interface Quest {
  id: string;
  config: QuestConfig;
  user_status?: {
    enrolled_at?: Date;
    completed_at?: Date;
    progress?: any
  };
  targeted_content: any[]; // Replace 'any' with a more specific type if needed
  preview: boolean;
}

