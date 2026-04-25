class ActivityRecord
  include Mongoid::Document
  include Mongoid::Timestamps

  field :source,       type: String   # netwrix_auditor | splunk | sentinel | generic_webhook
  field :module,       type: String   # ad | entra | fileserver | sharepoint | exchange | teams
  field :event_id,     type: String
  field :event_name,   type: String
  field :severity,     type: String,  default: "info"
  field :severity_score, type: Integer, default: 0
  field :timestamp,    type: Time
  field :who,          type: String
  field :what,         type: String
  field :where,        type: String
  field :source_ip,    type: String
  field :dest_ip,      type: String
  field :action,       type: String
  field :object_name,  type: String
  field :object_type,  type: String
  field :outcome,      type: String
  field :extensions,   type: Hash,    default: {}
  field :raw,          type: String
  field :ingested_at,  type: Time

  index({ timestamp: -1 })
  index({ module: 1, timestamp: -1 })
  index({ severity: 1, timestamp: -1 })
  index({ who: 1, timestamp: -1 })
  index({ source: 1 })

  before_create { self.ingested_at = Time.current }

  scope :last_24h,     -> { where(:timestamp.gte => 24.hours.ago) }
  scope :last_7d,      -> { where(:timestamp.gte => 7.days.ago) }
  scope :last_30d,     -> { where(:timestamp.gte => 30.days.ago) }
  scope :for_module,   ->(m) { where(module: m) }
  scope :high_severity,-> { where(:severity.in => %w[critical high]) }
  scope :failed,       -> { where(outcome: "Failure") }
  scope :off_hours,    -> {
    where(:timestamp.gte => 30.days.ago).select do |r|
      h = r.timestamp&.hour
      h && (h < 7 || h > 19)
    end
  }

  def self.failed_logins(username)
    where(who: username, event_name: /logon/i, outcome: "Failure").last_7d.count
  end

  def self.unique_shares(username)
    where(who: username, module: "fileserver").last_7d.distinct(:where).count
  end

  def self.recent_summary
    {
      total_24h:    last_24h.count,
      failed_24h:   last_24h.failed.count,
      critical_24h: last_24h.high_severity.count,
      by_module:    last_24h.group_by(&:module).transform_values(&:count)
    }
  end
end
