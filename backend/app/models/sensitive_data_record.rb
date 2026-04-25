class SensitiveDataRecord
  include Mongoid::Document
  include Mongoid::Timestamps

  field :source_module,      type: String   # fileserver | sharepoint | exchange | teams
  field :path,               type: String
  field :share,              type: String
  field :site,               type: String   # for SharePoint
  field :classification,     type: String   # PII | PCI | PHI | Confidential | etc.
  field :classification_tags,type: Array,   default: []
  field :risk_score,         type: Integer, default: 0
  field :owner,              type: String
  field :last_accessed_by,   type: String
  field :last_accessed_at,   type: Time
  field :access_count_30d,   type: Integer, default: 0
  field :external_access,    type: Boolean, default: false
  field :publicly_accessible,type: Boolean, default: false
  field :file_size_bytes,    type: Integer
  field :file_type,          type: String
  field :discovered_at,      type: Time
  field :last_synced_at,     type: Time

  index({ source_module: 1, risk_score: -1 })
  index({ classification: 1 })
  index({ share: 1 })
  index({ external_access: 1 })
  index({ publicly_accessible: 1 })

  scope :high_risk,    -> { where(:risk_score.gte => 70) }
  scope :external,     -> { where(external_access: true) }
  scope :public_files, -> { where(publicly_accessible: true) }
  scope :by_module,    ->(m) { where(source_module: m) }

  def self.summary
    {
      total:       count,
      high_risk:   high_risk.count,
      external:    external.count,
      public:      public_files.count,
      by_class:    group_by_classification,
      by_module:   all.group_by(&:source_module).transform_values(&:count)
    }
  end

  def self.heatmap_data(module_name)
    by_module(module_name).group_by(&:share).map do |share, records|
      { share: share, count: records.count, avg_risk: records.sum(&:risk_score) / records.size }
    end.sort_by { |h| -h[:avg_risk] }
  end

  private

  def self.group_by_classification
    all.group_by(&:classification).transform_values(&:count)
  end
end
