module Pingcastle
  class Runner
    # Expected location: tools/PingCastle.exe (Windows) or tools/PingCastle (Linux/Wine)
    EXE_PATH      = Rails.root.join("tools", "PingCastle.exe").to_s
    OUTPUT_DIR    = Rails.root.join("tmp", "pingcastle").to_s
    REPORT_GLOB   = File.join(OUTPUT_DIR, "ad_hc_*.xml")

    def initialize(domain: nil)
      @domain = domain
    end

    # Runs PingCastle healthcheck and returns parsed results.
    # On Windows Server the .exe runs natively.
    # On Linux dev containers it can run via Wine.
    def run
      raise "PingCastle.exe not found at #{EXE_PATH}" unless File.exist?(EXE_PATH)

      FileUtils.mkdir_p(OUTPUT_DIR)
      clean_old_reports

      cmd = build_command
      Rails.logger.info("[PingCastle] Running: #{cmd}")

      output = `#{cmd} 2>&1`
      exit_code = $?.exitstatus

      Rails.logger.info("[PingCastle] Exit code: #{exit_code}\n#{output}")
      raise "PingCastle failed (exit #{exit_code}): #{output}" unless exit_code == 0

      xml_path = latest_report
      raise "PingCastle XML report not found after run" unless xml_path

      xml_content = File.read(xml_path)
      parsed      = XmlParser.parse(xml_content)

      store_report(xml_content, parsed)
      parsed
    end

    private

    def build_command
      args = ["--healthcheck", "--no-enum-limit", "--out", OUTPUT_DIR]
      args += ["--server", @domain] if @domain
      "\"#{EXE_PATH}\" #{args.join(" ")}"
    end

    def latest_report
      Dir.glob(REPORT_GLOB).max_by { |f| File.mtime(f) }
    end

    def clean_old_reports
      Dir.glob(REPORT_GLOB).each { |f| File.delete(f) }
    end

    def store_report(xml_content, parsed)
      PingcastleReport.create!(
        domain_name:  parsed[:domain_name],
        scores:       parsed[:scores],
        risk_rules:   parsed[:risk_rules],
        stale_objects: parsed[:stale_objects],
        privileged_groups: parsed[:privileged_groups],
        trusts:       parsed[:trusts],
        anomalies:    parsed[:anomalies],
        summary:      parsed[:summary],
        raw_xml:      xml_content,
        generated_at: parsed[:generated_at]
      )
    end
  end
end
