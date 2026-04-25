class AlertRulesEngine
  RULES = [
    {
      name:      "brute_force_logon",
      module:    "ad",
      condition: ->(evt) { evt[:event_name]&.match?(/logon/i) && evt[:outcome] == "Failure" },
      threshold: 5,
      window:    15.minutes,
      severity:  "high",
      title:     "Brute Force Logon Detected",
      message:   ->(evt) { "#{evt[:who]} had repeated failed logons from #{evt[:source_ip]}" }
    },
    {
      name:      "off_hours_sensitive_access",
      condition: ->(evt) {
        h = evt[:timestamp]&.hour
        h && (h < 7 || h > 19) && evt[:module] == "fileserver" && evt[:object_type]&.match?(/sensitive/i)
      },
      severity:  "high",
      title:     "Off-Hours Sensitive Data Access",
      message:   ->(evt) { "#{evt[:who]} accessed #{evt[:object_name]} outside business hours" }
    },
    {
      name:      "privileged_group_change",
      module:    "ad",
      condition: ->(evt) { evt[:event_name]&.match?(/member added|group modified/i) && evt[:object_name]&.match?(/admin|domain|enterprise/i) },
      severity:  "critical",
      title:     "Privileged Group Modified",
      message:   ->(evt) { "#{evt[:who]} modified privileged group #{evt[:object_name]}" }
    },
    {
      name:      "external_file_sharing",
      module:    "sharepoint",
      condition: ->(evt) { evt[:event_name]&.match?(/shared.*external|anonymous link/i) },
      severity:  "high",
      title:     "External File Sharing Detected",
      message:   ->(evt) { "#{evt[:who]} shared #{evt[:object_name]} externally" }
    },
    {
      name:      "email_forwarding_rule",
      module:    "exchange",
      condition: ->(evt) { evt[:event_name]&.match?(/forwarding rule|transport rule/i) },
      severity:  "critical",
      title:     "Email Forwarding Rule Created",
      message:   ->(evt) { "#{evt[:who]} created a mail forwarding rule — potential data exfiltration" }
    },
    {
      name:      "gpo_change",
      module:    "ad",
      condition: ->(evt) { evt[:event_name]&.match?(/group policy|gpo/i) && evt[:action]&.match?(/modified|created|deleted/i) },
      severity:  "high",
      title:     "Group Policy Object Changed",
      message:   ->(evt) { "#{evt[:who]} #{evt[:action]&.downcase} GPO #{evt[:object_name]}" }
    },
    {
      name:      "entra_mfa_disabled",
      module:    "entra",
      condition: ->(evt) { evt[:event_name]&.match?(/mfa disabled|authentication method deleted/i) },
      severity:  "critical",
      title:     "MFA Disabled for User",
      message:   ->(evt) { "MFA was disabled for #{evt[:who]} in Entra ID" }
    },
    {
      name:      "mass_delete",
      condition: ->(evt) { evt[:action]&.match?(/delete/i) },
      threshold: 50,
      window:    10.minutes,
      severity:  "critical",
      title:     "Mass Deletion Detected",
      message:   ->(evt) { "#{evt[:who]} performed mass deletion in #{evt[:module]}" }
    }
  ].freeze

  def self.evaluate(evt, record)
    RULES.each do |rule|
      next if rule[:module] && rule[:module] != evt[:module]
      next unless rule[:condition].call(evt)

      if rule[:threshold]
        # Count recent matching events for this user
        count = ActivityRecord
          .where(who: evt[:who], event_name: /#{Regexp.escape(evt[:event_name] || "")}/i)
          .where(:timestamp.gte => Time.current - (rule[:window] || 10.minutes))
          .count

        next if count < rule[:threshold]
      end

      Alert.raise_alert(
        module_name: evt[:module] || "unknown",
        severity:    rule[:severity],
        title:       rule[:title],
        description: rule[:message].call(evt),
        who:         evt[:who],
        what:        evt[:what],
        where:       evt[:where],
        source:      evt[:source],
        tags:        [rule[:name]]
      )
    end
  end
end
