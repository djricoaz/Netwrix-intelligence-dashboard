class KpiAggregator
  def self.for_module(mod)
    klass = "#{mod.to_s.camelize}::KpiAggregator"
    klass.constantize.summary
  rescue NameError
    {}
  end
end

module Ad
  class KpiAggregator
    def self.summary
      base   = ActivityRecord.for_module("ad")
      last7  = base.last_7d
      last24 = base.last_24h

      {
        total_events_7d:    last7.count,
        failed_logins_24h:  last24.where(event_name: /logon/i, outcome: "Failure").count,
        privileged_changes: last7.where(event_name: /member added|admin/i).count,
        gpo_changes:        last7.where(event_name: /group policy/i).count,
        off_hours_events:   last24.off_hours.count,
        critical_users:     UserRiskScore.critical.count,
        high_risk_users:    UserRiskScore.high_risk.count,
        pingcastle_score:   PingcastleReport.latest&.global_score || 0,
        active_alerts:      Alert.active.for_module("ad").count
      }
    end
  end
end

module Entra
  class KpiAggregator
    def self.summary
      base  = ActivityRecord.for_module("entra")
      last7 = base.last_7d

      {
        total_events_7d:     last7.count,
        risky_sign_ins:      last7.where(event_name: /risky sign-in/i).count,
        mfa_failures:        last7.where(event_name: /mfa/i, outcome: "Failure").count,
        ca_bypasses:         last7.where(event_name: /conditional access.*bypass/i).count,
        app_consents:        last7.where(event_name: /consent/i).count,
        disabled_mfa_users:  last7.where(event_name: /mfa disabled/i).count,
        active_alerts:       Alert.active.for_module("entra").count
      }
    end
  end
end

module Fileserver
  class KpiAggregator
    def self.summary
      base  = ActivityRecord.for_module("fileserver")
      last7 = base.last_7d

      {
        total_events_7d:      last7.count,
        sensitive_exposed:    SensitiveDataRecord.by_module("fileserver").high_risk.count,
        externally_shared:    SensitiveDataRecord.by_module("fileserver").external.count,
        mass_access_events:   last7.where(event_name: /accessed/i).group_by(&:who).count { |_, v| v.size > 100 },
        off_hours_events:     last7.off_hours.count,
        failed_access:        last7.failed.count,
        active_alerts:        Alert.active.for_module("fileserver").count
      }
    end
  end
end

module Sharepoint
  class KpiAggregator
    def self.summary
      base  = ActivityRecord.for_module("sharepoint")
      last7 = base.last_7d

      {
        total_events_7d:    last7.count,
        external_sharing:   last7.where(event_name: /external|anonymous/i).count,
        sensitive_items:    SensitiveDataRecord.by_module("sharepoint").count,
        high_risk_items:    SensitiveDataRecord.by_module("sharepoint").high_risk.count,
        overshared_sites:   SensitiveDataRecord.by_module("sharepoint").external.distinct(:site).count,
        active_alerts:      Alert.active.for_module("sharepoint").count
      }
    end
  end
end

module Exchange
  class KpiAggregator
    def self.summary
      base  = ActivityRecord.for_module("exchange")
      last7 = base.last_7d

      {
        total_events_7d:    last7.count,
        dlp_violations:     last7.where(event_name: /dlp|policy violation/i).count,
        forwarding_rules:   last7.where(event_name: /forwarding rule/i).count,
        sensitive_emails:   SensitiveDataRecord.by_module("exchange").count,
        mailbox_access:     last7.where(event_name: /mailbox access|full access/i).count,
        active_alerts:      Alert.active.for_module("exchange").count
      }
    end
  end
end

module Teams
  class KpiAggregator
    def self.summary
      base  = ActivityRecord.for_module("teams")
      last7 = base.last_7d

      {
        total_events_7d:    last7.count,
        guest_activity:     last7.where(who: /#EXT#/i).count,
        external_access:    last7.where(event_name: /external access/i).count,
        sensitive_messages: SensitiveDataRecord.by_module("teams").count,
        channels_created:   last7.where(event_name: /channel created/i).count,
        active_alerts:      Alert.active.for_module("teams").count
      }
    end
  end
end
