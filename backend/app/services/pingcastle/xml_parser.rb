module Pingcastle
  class XmlParser
    # Parses a PingCastle healthcheck XML report and returns a normalized hash
    def self.parse(xml_content)
      doc = Nokogiri::XML(xml_content)
      doc.remove_namespaces!

      {
        generated_at:   doc.at("GenerationDate")&.text,
        domain_name:    doc.at("DomainFQDN")&.text,
        domain_sid:     doc.at("DomainSid")&.text,
        scores:         parse_scores(doc),
        risk_rules:     parse_risk_rules(doc),
        privileged_groups: parse_privileged_groups(doc),
        stale_objects:  parse_stale_objects(doc),
        trusts:         parse_trusts(doc),
        anomalies:      parse_anomalies(doc),
        summary:        parse_summary(doc)
      }
    end

    private

    def self.parse_scores(doc)
      {
        global:          doc.at("GlobalScore")&.text&.to_i,
        stale:           doc.at("StaleObjectsScore")&.text&.to_i,
        privileged:      doc.at("PrivilegedGroupScore")&.text&.to_i,
        trust:           doc.at("TrustScore")&.text&.to_i,
        anomaly:         doc.at("AnomalyScore")&.text&.to_i
      }
    end

    def self.parse_risk_rules(doc)
      doc.xpath("//RiskRule").map do |rule|
        {
          rule_id:     rule.at("RuleId")&.text,
          category:    rule.at("Category")&.text,
          model:       rule.at("Model")&.text,
          risk_id:     rule.at("RiskId")&.text,
          points:      rule.at("Points")&.text&.to_i,
          rationale:   rule.at("Rationale")&.text,
          details:     rule.at("Details")&.text
        }
      end
    end

    def self.parse_privileged_groups(doc)
      doc.xpath("//PrivilegedGroup").map do |group|
        {
          name:             group.at("GroupName")&.text,
          member_count:     group.at("NumberOfMember")&.text&.to_i,
          indirect_members: group.at("NumberOfIndirectMember")&.text&.to_i,
          enabled:          group.at("NumberOfMemberEnabled")&.text&.to_i
        }
      end
    end

    def self.parse_stale_objects(doc)
      {
        inactive_users_180d: doc.at("InactiveUserCount")&.text&.to_i,
        inactive_computers:  doc.at("InactiveComputerCount")&.text&.to_i,
        disabled_users:      doc.at("DisabledUserCount")&.text&.to_i,
        never_logged_in:     doc.at("NeverLoggedInCount")&.text&.to_i
      }
    end

    def self.parse_trusts(doc)
      doc.xpath("//Trust").map do |trust|
        {
          domain:        trust.at("Domain")&.text,
          trust_type:    trust.at("TrustType")&.text,
          trust_direction: trust.at("TrustDirection")&.text,
          sidhistory:    trust.at("SIDHistoryEnabled")&.text == "true"
        }
      end
    end

    def self.parse_anomalies(doc)
      doc.xpath("//Anomaly").map do |a|
        { type: a.at("Type")&.text, detail: a.at("Detail")&.text }
      end
    end

    def self.parse_summary(doc)
      {
        user_count:      doc.at("UserAccountCount")&.text&.to_i,
        computer_count:  doc.at("ComputerCount")&.text&.to_i,
        admin_count:     doc.at("AdminCount")&.text&.to_i,
        functional_level: doc.at("DomainFunctionalLevel")&.text
      }
    end
  end
end
