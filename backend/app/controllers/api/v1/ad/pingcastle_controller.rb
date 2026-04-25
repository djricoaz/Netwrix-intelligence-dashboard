module Api
  module V1
    module Ad
      class PingcastleController < ApplicationController
        # POST /api/v1/ad/pingcastle/run
        # Executes PingCastle.exe on the server and returns parsed results
        def run
          domain  = params[:domain]
          result  = Pingcastle::Runner.new(domain: domain).run
          render json: { status: "success", data: result }
        rescue => e
          render json: { status: "error", message: e.message }, status: :unprocessable_entity
        end

        # POST /api/v1/ad/pingcastle/upload
        # Upload an existing PingCastle XML report
        def upload
          xml_file = params.require(:file)
          parsed   = Pingcastle::XmlParser.parse(xml_file.read)

          PingcastleReport.create!(
            domain_name:       parsed[:domain_name],
            scores:            parsed[:scores],
            risk_rules:        parsed[:risk_rules],
            stale_objects:     parsed[:stale_objects],
            privileged_groups: parsed[:privileged_groups],
            trusts:            parsed[:trusts],
            anomalies:         parsed[:anomalies],
            summary:           parsed[:summary],
            raw_xml:           xml_file.read,
            generated_at:      parsed[:generated_at]
          )

          render json: { status: "success", data: parsed }
        rescue => e
          render json: { status: "error", message: e.message }, status: :unprocessable_entity
        end

        # GET /api/v1/ad/pingcastle/latest
        def latest
          report = PingcastleReport.latest
          return render json: { error: "No report found" }, status: 404 unless report

          render json: {
            generated_at:      report.generated_at,
            scores:            report.scores,
            critical_rules:    report.critical_rules,
            stale_objects:     report.stale_objects,
            privileged_groups: report.privileged_groups,
            trusts:            report.trusts,
            anomalies:         report.anomalies,
            summary:           report.summary,
            score_trend:       report.risk_score_trend
          }
        end

        # GET /api/v1/ad/pingcastle/compare
        # Compares last two reports to show what changed
        def compare
          reports = PingcastleReport.order(created_at: :desc).limit(2)
          return render json: { error: "Need at least 2 reports" }, status: 422 if reports.size < 2

          latest, previous = reports[0], reports[1]
          render json: {
            latest:   { date: latest.created_at, scores: latest.scores },
            previous: { date: previous.created_at, scores: previous.scores },
            delta:    compute_delta(previous.scores, latest.scores),
            new_rules: (latest.risk_rules.map { |r| r["rule_id"] } - previous.risk_rules.map { |r| r["rule_id"] })
          }
        end

        # GET /api/v1/ad/pingcastle/correlate
        # Correlates PingCastle findings with NA AD events
        def correlate
          report = PingcastleReport.latest
          return render json: { error: "No report" }, status: 404 unless report

          critical_rules = report.critical_rules
          correlated = critical_rules.map do |rule|
            events = fetch_na_events_for_rule(rule)
            rule.merge("related_events" => events)
          end

          render json: { correlated_findings: correlated, generated_at: Time.current.iso8601 }
        end

        private

        def compute_delta(prev_scores, latest_scores)
          latest_scores.transform_values do |val|
            prev = prev_scores[val.to_s]&.to_i || 0
            { current: val, previous: prev, change: val.to_i - prev }
          end
        end

        def fetch_na_events_for_rule(rule)
          case rule["category"]
          when "Privileged Accounts"
            Netwrix::AuditorClient.new.activity_records(object_type: "User", from: 7.days.ago.utc.iso8601, to: Time.now.utc.iso8601)
                                  .first(10)
          when "Stale Objects"
            Netwrix::AuditorClient.new.activity_records(action: "Disabled", from: 30.days.ago.utc.iso8601, to: Time.now.utc.iso8601)
                                  .first(10)
          else
            []
          end
        end
      end
    end
  end
end
