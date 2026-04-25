class Alert
  include Mongoid::Document
  include Mongoid::Timestamps

  SEVERITIES = %w[critical high medium low].freeze

  field :module,          type: String
  field :source,          type: String
  field :severity,        type: String
  field :title,           type: String
  field :description,     type: String
  field :who,             type: String
  field :what,            type: String
  field :where,           type: String
  field :timestamp,       type: Time
  field :status,          type: String, default: "active"   # active | acknowledged | resolved
  field :acknowledged_by, type: String
  field :acknowledged_at, type: Time
  field :resolved_at,     type: Time
  field :ai_recommendation, type: String
  field :related_event_ids, type: Array, default: []
  field :tags,            type: Array,  default: []

  index({ status: 1, severity: 1, created_at: -1 })
  index({ module: 1, status: 1 })
  index({ who: 1 })

  scope :active,      -> { where(status: "active") }
  scope :for_module,  ->(m) { where(module: m) }
  scope :critical,    -> { where(severity: "critical") }
  scope :high_and_up, -> { where(:severity.in => %w[critical high]) }

  def self.active_count
    active.count
  end

  def self.raise_alert(module_name:, severity:, title:, description:, who: nil, what: nil, where: nil, source: "system", tags: [])
    existing = active.find_by(module: module_name, title: title, who: who) rescue nil
    return existing if existing

    alert = create!(
      module: module_name, source: source, severity: severity,
      title: title, description: description,
      who: who, what: what, where: where,
      timestamp: Time.current, tags: tags
    )

    # Enrich with AI recommendation async
    EnrichAlertWithAiJob.perform_later(alert.id.to_s)

    # Forward to configured SIEM integrations
    ForwardAlertJob.perform_later(alert.id.to_s)

    alert
  end

  def acknowledge!(by:)
    update!(status: "acknowledged", acknowledged_by: by, acknowledged_at: Time.current)
  end

  def resolve!
    update!(status: "resolved", resolved_at: Time.current)
  end
end
