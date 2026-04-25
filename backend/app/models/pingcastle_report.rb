class PingcastleReport
  include Mongoid::Document
  include Mongoid::Timestamps

  field :domain_name,       type: String
  field :generated_at,      type: String
  field :scores,            type: Hash    # global, stale, privileged, trust, anomaly
  field :risk_rules,        type: Array   # [{rule_id, category, points, rationale, details}]
  field :stale_objects,     type: Hash
  field :privileged_groups, type: Array
  field :trusts,            type: Array
  field :anomalies,         type: Array
  field :summary,           type: Hash    # user_count, computer_count, admin_count, etc.
  field :raw_xml,           type: String

  index({ created_at: -1 })
  index({ domain_name: 1 })

  scope :latest, -> { order(created_at: :desc).first }

  def global_score = scores&.dig("global") || 0
  def risk_score_trend = self.class.order(created_at: :asc).last(10).map { |r| { date: r.created_at.to_date, score: r.global_score } }

  # Returns rules above a points threshold (higher = riskier)
  def critical_rules(threshold: 10)
    (risk_rules || []).select { |r| r["points"].to_i >= threshold }.sort_by { |r| -r["points"].to_i }
  end
end
