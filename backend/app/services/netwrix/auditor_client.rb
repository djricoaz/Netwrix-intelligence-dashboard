module Netwrix
  class AuditorClient
    BASE_URL = ENV["NA_BASE_URL"]
    PAGE_SIZE = 1000

    def initialize
      @conn = Faraday.new(url: BASE_URL, ssl: { verify: false }) do |f|
        f.request :ntlm, ENV["NA_USERNAME"], ENV["NA_PASSWORD"]
        f.request :json
        f.response :json
        f.adapter Faraday.default_adapter
      end
    end

    # Fetch all activity records with optional filters
    # filters: { who: "", object_type: "", action: "", from: Time, to: Time }
    def activity_records(filters = {})
      body = build_filter_body(filters)
      records = []
      cursor = nil

      loop do
        payload = cursor ? { cursor: cursor } : body
        response = cursor ? @conn.post("activity_records/enum", payload) : @conn.post("activity_records/search", payload)
        break unless response.success?

        batch = response.body
        records.concat(batch["ActivityRecords"] || [])
        cursor = batch["Cursor"]
        break if cursor.nil? || (batch["ActivityRecords"] || []).size < PAGE_SIZE
      end

      records
    end

    def users_activity_summary(days: 7)
      from = days.days.ago.utc.iso8601
      to = Time.now.utc.iso8601
      activity_records(from: from, to: to)
        .group_by { |r| r["Who"] }
        .transform_values(&:count)
        .sort_by { |_, count| -count }
    end

    private

    def build_filter_body(filters)
      {
        "Filters" => [
          filters[:who]         && { "PropertyName" => "Who",        "Operator" => "Contains", "Value" => filters[:who] },
          filters[:object_type] && { "PropertyName" => "ObjectType", "Operator" => "Equals",   "Value" => filters[:object_type] },
          filters[:action]      && { "PropertyName" => "Action",     "Operator" => "Equals",   "Value" => filters[:action] },
          filters[:from]        && { "PropertyName" => "When",       "Operator" => "GreaterThanOrEqual", "Value" => filters[:from] },
          filters[:to]          && { "PropertyName" => "When",       "Operator" => "LessThanOrEqual",    "Value" => filters[:to] }
        ].compact
      }
    end
  end
end
