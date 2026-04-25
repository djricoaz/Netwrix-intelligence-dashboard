module Integrations
  module Outbound
    # Forwards events to Microsoft Sentinel via Log Analytics Data Collector API.
    class SentinelConnector < BaseConnector
      connector_name        :sentinel
      connector_label       "Microsoft Sentinel"
      connector_description "Forward alerts and events to Microsoft Sentinel Log Analytics Workspace"
      connector_direction   :outbound
      connector_schema({
        workspace_id:  { type: "string",   label: "Log Analytics Workspace ID" },
        shared_key:    { type: "password", label: "Primary or Secondary Key" },
        log_type:      { type: "string",   label: "Custom Log Type", default: "NetwrixIntelligence" }
      })

      register!

      LOG_ANALYTICS_URL = "https://%s.ods.opinsights.azure.com/api/logs?api-version=2016-04-01"

      def dispatch(normalized_event)
        dispatch_batch([normalized_event])
      end

      def dispatch_batch(events)
        body      = events.to_json
        date      = Time.now.utc.strftime("%a, %d %b %Y %H:%M:%S GMT")
        signature = build_signature(body, date)
        url       = LOG_ANALYTICS_URL % config[:workspace_id]

        conn = Faraday.new do |f|
          f.headers["Authorization"] = signature
          f.headers["Log-Type"]      = config[:log_type] || "NetwrixIntelligence"
          f.headers["x-ms-date"]     = date
          f.headers["Content-Type"]  = "application/json"
          f.adapter Faraday.default_adapter
          f.options.timeout = 15
        end

        response = conn.post(url, body)
        response.success?
      rescue => e
        err("Sentinel dispatch failed: #{e.message}")
        false
      end

      private

      def build_signature(body, date)
        string_to_hash = "POST\n#{body.bytesize}\napplication/json\nx-ms-date:#{date}\n/api/logs"
        bytes_to_hash  = string_to_hash.encode("utf-8")
        decoded_key    = Base64.decode64(config[:shared_key])
        hmac           = OpenSSL::HMAC.digest("sha256", decoded_key, bytes_to_hash)
        encoded        = Base64.encode64(hmac).strip
        "SharedKey #{config[:workspace_id]}:#{encoded}"
      end
    end
  end
end
