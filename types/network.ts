export type NetworkProfile = {
  id: string;
  display_name: string;
  headline: string;
  location: string;
  about: string;
  avatar_url: string | null;
  cover_url: string | null;
  skills: string[];
  languages: string[];
  website: string | null;
  profile_views: number;
  created_at: string;
  updated_at: string;
};

export type ProfileExperience = {
  id: string;
  user_id: string;
  title: string;
  company: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  created_at: string;
};

export type ProfileEducation = {
  id: string;
  user_id: string;
  school: string;
  degree: string | null;
  field: string | null;
  start_year: number | null;
  end_year: number | null;
  description: string | null;
  created_at: string;
};

export type ConnectionStatus = "pending" | "accepted" | "ignored";
export type Connection = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
};

export type PostMediaType = "image" | "video";

export type NetworkPost = {
  id: string;
  author_id: string;
  body: string;
  title?: string | null;
  media_url?: string | null;
  media_type?: PostMediaType | null;
  visibility: "public" | "connections";
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  created_at: string;
  author?: Pick<NetworkProfile, "id" | "display_name" | "headline" | "avatar_url">;
  liked_by_me?: boolean;
  reposted_by_me?: boolean;
};

export type PostComment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: Pick<NetworkProfile, "id" | "display_name" | "headline" | "avatar_url">;
};

export type JobLevel = "Entry" | "Mid" | "Senior" | "Manager";
export type JobType = "Full-time" | "Part-time" | "Contract";

export type NetworkJob = {
  id: string;
  posted_by: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  easy_apply: boolean;
  sponsored: boolean;
  salary_low: number | null;
  salary_high: number | null;
  level: JobLevel;
  job_type: JobType;
  description: string;
  responsibilities: string[];
  qualifications: string[];
  benefits: string[];
  applicants_count: number;
  created_at: string;
  saved_by_me?: boolean;
  applied_by_me?: boolean;
};

export type JobApplication = {
  id: string;
  job_id: string;
  applicant_id: string;
  cover_letter: string | null;
  status: "submitted" | "reviewed" | "rejected" | "shortlisted";
  created_at: string;
};

export type Thread = {
  id: string;
  created_at: string;
  last_message_at: string;
  participants: Array<Pick<NetworkProfile, "id" | "display_name" | "headline" | "avatar_url">>;
  last_message?: NetworkMessage;
  unread_count?: number;
};

export type NetworkMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type NotificationKind =
  | "connection_request"
  | "connection_accepted"
  | "post_like"
  | "post_comment"
  | "job_posted"
  | "message"
  | "profile_view";

export type NetworkNotification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  kind: NotificationKind;
  payload: Record<string, unknown>;
  unread: boolean;
  created_at: string;
  actor?: Pick<NetworkProfile, "id" | "display_name" | "headline" | "avatar_url">;
};
