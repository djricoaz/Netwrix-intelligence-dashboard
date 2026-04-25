module Netwrix
  # Queries Netwrix Auditor to discover which data sources are actively monitored.
  # The dashboard enables/disables modules based on what NA actually has configured.
  class SourceDiscovery
    NA_SOURCE_MAP = {
      "Active Directory"         => :ad,
      "Entra ID"                 => :entra,
      "Azure AD"                 => :entra,
      "Windows File Servers"     => :fileserver,
      "NetApp"                   => :fileserver,
      "EMC"                      => :fileserver,
      "SharePoint"               => :sharepoint,
      "SharePoint Online"        => :sharepoint,
      "Exchange"                 => :exchange,
      "Exchange Online"          => :exchange,
      "Microsoft Teams"          => :teams
    }.freeze

    NDC_SOURCE_MAP = {
      "File System"              => :fileserver,
      "SharePoint"               => :sharepoint,
      "SharePoint Online"        => :sharepoint,
      "Exchange"                 => :exchange,
      "Exchange Online"          => :exchange,
      "Box"                      => :cloud_storage,
      "Dropbox"                  => :cloud_storage,
      "Google Drive"             => :cloud_storage
    }.freeze

    def initialize
      @na_client  = AuditorClient.new
      @ndc_client = DataClassificationClient.new
    end

    # Returns the set of enabled module keys based on NA + NDC configured sources
    # Example result: { ad: true, fileserver: true, sharepoint: true, exchange: false, teams: false, entra: false }
    def discover
      na_modules  = detect_na_sources
      ndc_modules = detect_ndc_sources

      all_modules = (na_modules + ndc_modules).uniq.sort

      {
        modules:       build_module_config(all_modules),
        na_sources:    na_modules,
        ndc_sources:   ndc_modules,
        discovered_at: Time.current.iso8601
      }
    end

    def self.cached
      cached = Rails.cache.read("source_discovery")
      return cached if cached

      result = new.discover
      Rails.cache.write("source_discovery", result, expires_in: 30.minutes)
      result
    end

    private

    def detect_na_sources
      # Query NA for distinct object types seen in the last 7 days
      records = @na_client.activity_records(from: 7.days.ago.utc.iso8601, to: Time.now.utc.iso8601)
      data_sources = records.map { |r| r["DataSource"] }.compact.uniq

      data_sources.filter_map { |src| NA_SOURCE_MAP[src] }.uniq
    rescue => e
      Rails.logger.warn("Source discovery NA failed: #{e.message}")
      []
    end

    def detect_ndc_sources
      classifications = @ndc_client.classifications
      sources = classifications.map { |c| c["source_type"] }.compact.uniq

      sources.filter_map { |src| NDC_SOURCE_MAP[src] }.uniq
    rescue => e
      Rails.logger.warn("Source discovery NDC failed: #{e.message}")
      []
    end

    def build_module_config(enabled_modules)
      {
        ad:          enabled_modules.include?(:ad),
        entra:       enabled_modules.include?(:entra),
        fileserver:  enabled_modules.include?(:fileserver),
        sharepoint:  enabled_modules.include?(:sharepoint),
        exchange:    enabled_modules.include?(:exchange),
        teams:       enabled_modules.include?(:teams)
      }
    end
  end
end
