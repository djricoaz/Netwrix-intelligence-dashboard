module Integrations
  module Inbound
    # Listens on a TCP port for CEF lines (from Netwrix CEF Export Add-on or any CEF source).
    # Runs as a Sidekiq-managed background thread (started by CefListenerJob).
    # Each received line is pushed into the event pipeline.
    class CefTcpListener < BaseConnector
      connector_name        :cef_tcp
      connector_label       "CEF TCP Listener"
      connector_description "Receives CEF events over TCP (Netwrix CEF Add-on, ArcSight, any SIEM CEF output)"
      connector_direction   :inbound
      connector_schema({
        port:    { type: "integer", label: "TCP Port", default: 5514 },
        source:  { type: "string",  label: "Source tag", default: "netwrix_auditor" }
      })

      register!

      def listen
        port   = config[:port]&.to_i || 5514
        source = config[:source] || "netwrix_auditor"

        log("Starting CEF TCP listener on port #{port}")
        server = TCPServer.new("0.0.0.0", port)

        loop do
          Thread.new(server.accept) do |client|
            client.each_line do |line|
              process_line(line.strip, source)
            end
            client.close
          end
        end
      rescue => e
        err("CEF listener crashed: #{e.message}")
        retry
      end

      private

      def process_line(line, source)
        return if line.empty?
        normalized = Pipeline::EventNormalizer.normalize({ raw: line }, source: source)
        IngestPipeline.ingest(normalized)
      rescue => e
        err("Failed to process CEF line: #{e.message} — #{line[0..100]}")
      end
    end
  end
end
