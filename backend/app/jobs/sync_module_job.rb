class SyncModuleJob < ApplicationJob
  queue_as :sync

  # Base sync job — subclassed per module
  def perform(module_name)
    Rails.logger.info("[Sync] Starting #{module_name} sync")
    records = fetch_records(module_name)
    normalized = records.map { |r| Pipeline::EventNormalizer.normalize(r, source: :netwrix_auditor) }
    Pipeline::IngestPipeline.ingest_batch(normalized)

    kpis = compute_kpis(module_name, normalized)
    InfluxService.new.write_kpi(module_name, kpis)

    IntegrationConfig.find_by(connector_name: "netwrix_auditor")&.record_success
    Rails.logger.info("[Sync] #{module_name}: #{records.size} records ingested")
  rescue => e
    Rails.logger.error("[Sync] #{module_name} failed: #{e.message}")
    raise
  end

  private

  def fetch_records(module_name)
    last_sync = ActivityRecord.for_module(module_name).order(timestamp: :desc).first&.timestamp || 24.hours.ago
    from = last_sync.utc.iso8601
    to   = Time.now.utc.iso8601

    object_type = {
      "ad"          => "User,Group,Computer,GPO",
      "entra"       => "Azure AD User,Service Principal,Application",
      "fileserver"  => "File,Folder",
      "sharepoint"  => "SharePoint Item,SharePoint Site",
      "exchange"    => "Mailbox,Message,Transport Rule",
      "teams"       => "Teams Channel,Teams Message"
    }[module_name]

    Netwrix::AuditorClient.new.activity_records(from: from, to: to, object_type: object_type)
  end

  def compute_kpis(module_name, events)
    {
      total_events:     events.size,
      critical_events:  events.count { |e| e[:severity] == "critical" },
      high_events:      events.count { |e| e[:severity] == "high" },
      failed_events:    events.count { |e| e[:outcome] == "Failure" },
      unique_users:     events.map { |e| e[:who] }.compact.uniq.size,
      off_hours_events: events.count { |e| h = e[:timestamp]&.hour; h && (h < 7 || h > 19) }
    }
  end
end
