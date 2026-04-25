module Pipeline
  module Strategies
    # Parses CEF (Common Event Format) produced by the Netwrix CEF Export Add-on.
    # CEF line format: CEF:0|Netwrix|Auditor|version|id|name|severity|extensions
    class NetwrixCefStrategy
      CEF_REGEX = /^CEF:(?<version>\d+)\|(?<vendor>[^|]*)\|(?<product>[^|]*)\|(?<product_version>[^|]*)\|(?<event_id>[^|]*)\|(?<event_name>[^|]*)\|(?<severity>\d+)\|(?<extensions>.*)$/

      def normalize(raw)
        line   = raw.is_a?(Hash) ? raw["raw"] : raw.to_s
        match  = line.match(CEF_REGEX)
        return build_unknown(raw) unless match

        extensions = parse_extensions(match[:extensions])

        {
          source:         "netwrix_auditor",
          event_id:       match[:event_id],
          event_name:     match[:event_name],
          severity:       map_cef_severity(match[:severity].to_i),
          severity_score: match[:severity].to_i,
          timestamp:      parse_time(extensions["rt"] || extensions["start"]),
          module:         detect_module(extensions),
          who:            extensions["suser"] || extensions["duser"],
          what:           extensions["msg"] || match[:event_name],
          where:          extensions["dhost"] || extensions["dvc"],
          source_ip:      extensions["src"],
          dest_ip:        extensions["dst"],
          action:         extensions["act"],
          object_name:    extensions["fname"] || extensions["filePath"],
          object_type:    extensions["fileType"],
          outcome:        extensions["outcome"],
          raw:            line,
          extensions:     extensions
        }.compact
      end

      private

      def parse_extensions(str)
        str.scan(/(\w+)=([^ ]+(?:\s(?!\w+=)[^ ]+)*)/).to_h
      end

      def parse_time(val)
        return Time.current unless val
        Time.at(val.to_i / 1000) rescue Time.current
      end

      def map_cef_severity(score)
        case score
        when 9..10 then "critical"
        when 7..8  then "high"
        when 4..6  then "medium"
        when 1..3  then "low"
        else            "info"
        end
      end

      def detect_module(ext)
        host = (ext["dhost"] || ext["dvc"] || "").downcase
        msg  = (ext["msg"]   || "").downcase
        return "ad"         if msg.include?("active directory") || msg.include?("group policy")
        return "entra"      if msg.include?("azure ad") || msg.include?("entra")
        return "exchange"   if msg.include?("exchange") || msg.include?("mailbox")
        return "sharepoint" if msg.include?("sharepoint")
        return "teams"      if msg.include?("teams")
        return "fileserver" if ext["fname"].present? || ext["filePath"].present?
        "unknown"
      end

      def build_unknown(raw)
        { source: "netwrix_auditor", event_name: "unparsed", raw: raw.to_s, timestamp: Time.current, severity: "info" }
      end
    end
  end
end
