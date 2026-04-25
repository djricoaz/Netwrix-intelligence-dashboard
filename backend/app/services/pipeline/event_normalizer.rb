module Pipeline
  # Normalizes any inbound event (from NA, NDC, SIEM, webhook, syslog)
  # into a common NormalizedEvent format stored in InfluxDB + MongoDB.
  #
  # Common format is inspired by CEF (Common Event Format) but stored as JSON.
  class EventNormalizer
    SEVERITY_MAP = {
      "critical" => 10, "high" => 7, "medium" => 5,
      "low" => 3, "info" => 1, "unknown" => 0
    }.freeze

    # Takes a raw event hash and source identifier, returns a NormalizedEvent
    def self.normalize(raw, source:)
      strategy = strategy_for(source)
      strategy.normalize(raw)
    end

    def self.normalize_batch(raws, source:)
      raws.map { |raw| normalize(raw, source: source) }
    end

    private

    def self.strategy_for(source)
      case source.to_sym
      when :netwrix_auditor    then Strategies::NetwrixAuditorStrategy.new
      when :netwrix_ndc        then Strategies::NetwrixNdcStrategy.new
      when :splunk             then Strategies::SplunkStrategy.new
      when :sentinel           then Strategies::SentinelStrategy.new
      when :qradar             then Strategies::QRadarStrategy.new
      when :elastic            then Strategies::ElasticStrategy.new
      when :syslog             then Strategies::SyslogStrategy.new
      when :generic_webhook    then Strategies::GenericWebhookStrategy.new
      else                          Strategies::GenericWebhookStrategy.new
      end
    end
  end
end
