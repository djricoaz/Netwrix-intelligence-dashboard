class UserRiskScore
  include Mongoid::Document
  include Mongoid::Timestamps

  field :username,          type: String
  field :display_name,      type: String
  field :department,        type: String
  field :event_count_7d,    type: Integer, default: 0
  field :failed_logins_7d,  type: Integer, default: 0
  field :sensitive_accesses,type: Integer, default: 0
  field :off_hours_events,  type: Integer, default: 0
  field :unique_shares,     type: Integer, default: 0
  field :ai_risk_score,     type: Float,   default: 0.0
  field :ai_risk_level,     type: String,  default: "unknown"
  field :ai_indicators,     type: Array,   default: []
  field :ai_recommendation, type: String
  field :ai_analyzed_at,    type: Time
  field :last_synced_at,    type: Time

  index({ username: 1 }, { unique: true })
  index({ ai_risk_score: -1 })
  index({ ai_risk_level: 1 })

  scope :high_risk,     -> { where(:ai_risk_level.in => ["high", "critical"]) }
  scope :critical,      -> { where(ai_risk_level: "critical") }
  scope :stale,         -> { where(:last_synced_at.lt => 1.hour.ago) }

  def self.summary
    {
      total:    count,
      critical: where(ai_risk_level: "critical").count,
      high:     where(ai_risk_level: "high").count,
      medium:   where(ai_risk_level: "medium").count,
      low:      where(ai_risk_level: "low").count
    }
  end

  def to_ai_context
    {
      username: username,
      event_count: event_count_7d,
      failed_logins: failed_logins_7d,
      sensitive_accesses: sensitive_accesses,
      off_hours_events: off_hours_events,
      unique_shares: unique_shares,
      data_moved_gb: 0
    }
  end
end
