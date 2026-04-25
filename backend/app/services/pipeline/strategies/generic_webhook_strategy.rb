module Pipeline
  module Strategies
    # Accepts any JSON payload. Tries to extract common fields by convention.
    # Works for: Microsoft Sentinel, Elastic, custom apps, any SIEM with HTTP output.
    class GenericWebhookStrategy
      TIMESTAMP_KEYS  = %w[timestamp time @timestamp eventTime TimeGenerated occurred_at created_at].freeze
      SEVERITY_KEYS   = %w[severity level priority sev].freeze
      WHO_KEYS        = %w[user username who actor subject initiator].freeze
      WHAT_KEYS       = %w[message msg description action event eventName].freeze
      WHERE_KEYS      = %w[host hostname computer source device].freeze
      MODULE_KEYS     = %w[module category source_type datasource].freeze

      def normalize(raw)
        flat = flatten(raw)

        {
          source:         raw["_source"] || raw["source"] || "generic_webhook",
          event_id:       flat["id"] || flat["eventId"] || SecureRandom.uuid,
          event_name:     extract(flat, WHAT_KEYS),
          severity:       map_severity(extract(flat, SEVERITY_KEYS)),
          timestamp:      parse_time(extract(flat, TIMESTAMP_KEYS)),
          module:         extract(flat, MODULE_KEYS) || "unknown",
          who:            extract(flat, WHO_KEYS),
          what:           extract(flat, WHAT_KEYS),
          where:          extract(flat, WHERE_KEYS),
          action:         flat["action"] || flat["act"],
          object_name:    flat["object"] || flat["fileName"] || flat["resource"],
          outcome:        flat["outcome"] || flat["result"] || flat["status"],
          raw:            raw.to_json,
          extensions:     raw
        }.compact
      end

      private

      def extract(flat, keys)
        keys.each { |k| return flat[k] if flat[k].present? }
        nil
      end

      def flatten(hash, prefix = nil)
        hash.each_with_object({}) do |(k, v), result|
          key = prefix ? "#{prefix}.#{k}" : k.to_s
          if v.is_a?(Hash)
            result.merge!(flatten(v, key))
          else
            result[key] = v
            result[k.to_s] = v  # also keep original key for direct access
          end
        end
      end

      def parse_time(val)
        return Time.current unless val
        Time.parse(val.to_s) rescue Time.at(val.to_i / 1000) rescue Time.current
      end

      def map_severity(val)
        return "info" unless val
        s = val.to_s.downcase
        return "critical" if %w[critical fatal 9 10].include?(s)
        return "high"     if %w[high error 7 8].include?(s)
        return "medium"   if %w[medium warning warn 4 5 6].include?(s)
        return "low"      if %w[low notice 1 2 3].include?(s)
        "info"
      end
    end
  end
end
