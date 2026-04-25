module Netwrix
  class AuditorClient
    PAGE_SIZE = 1000

    def initialize(base_url: nil, username: nil, password: nil)
      cfg  = AppConfig.instance rescue nil
      url  = base_url || cfg&.na_url  || ENV["NA_BASE_URL"]
      user = username || cfg&.na_username || ENV["NA_USERNAME"]
      pass = password || cfg&.na_password || ENV["NA_PASSWORD"]

      raise ArgumentError, "NA_BASE_URL not configured" if url.blank?

      @user = user
      @pass = pass

      @conn = Faraday.new(url: url, ssl: { verify: false }) do |f|
        f.request  :authorization, :basic, user, pass
        f.adapter  Faraday.default_adapter
      end
    end

    def health_check
      response = @conn.get("activity_records/enum")
      response.status < 400
    rescue => e
      Rails.logger.warn("[NA] health_check failed: #{e.message}")
      false
    end

    # Fetch activity records with optional filters
    # filters: { who: "", object_type: "", action: "", from: Time, to: Time }
    def activity_records(filters = {})
      params = build_query_params(filters)
      response = @conn.get("activity_records/enum") { |req| req.params.merge!(params) }
      return [] unless response.success?
      parse_xml_records(response.body)
    rescue => e
      Rails.logger.error("[NA] activity_records failed: #{e.message}")
      []
    end

    def users_activity_summary(days: 7)
      from = days.days.ago.utc.iso8601
      to   = Time.now.utc.iso8601
      activity_records(from: from, to: to)
        .group_by { |r| r["Who"] }
        .transform_values(&:count)
        .sort_by { |_, count| -count }
    end

    private

    def parse_xml_records(xml_body)
      return [] if xml_body.blank?
      doc = Nokogiri::XML(xml_body)
      doc.remove_namespaces!
      doc.xpath("//ActivityRecord").map do |node|
        {
          "Who"         => node.at_xpath("Who")&.text,
          "What"        => node.at_xpath("What")&.text,
          "Action"      => node.at_xpath("Action")&.text,
          "When"        => node.at_xpath("When")&.text,
          "Where"       => node.at_xpath("Where")&.text,
          "ObjectType"  => node.at_xpath("ObjectType")&.text,
          "DataSource"  => node.at_xpath("DataSource")&.text,
          "Workstation" => node.at_xpath("Workstation")&.text,
          "RID"         => node.at_xpath("RID")&.text
        }
      end
    end

    def build_query_params(filters)
      params = {}
      params[:who]        = filters[:who]         if filters[:who].present?
      params[:objectType] = filters[:object_type] if filters[:object_type].present?
      params[:action]     = filters[:action]      if filters[:action].present?
      params[:from]       = filters[:from]        if filters[:from].present?
      params[:to]         = filters[:to]          if filters[:to].present?
      params
    end
  end
end
