module Api
  module V1
    class AiController < ApplicationController
      def predict_risk
        user = UserRiskScore.find_by(username: params[:username])
        return render json: { error: "User not found" }, status: 404 unless user

        result = OllamaService.new.predict_user_risk(user.to_ai_context)
        user.update(ai_risk_score: result["risk_score"], ai_risk_level: result["risk_level"],
                    ai_indicators: result["indicators"], ai_recommendation: result["recommendation"],
                    ai_analyzed_at: Time.current)

        render json: result
      end

      def analyze_user
        username = params[:username]
        activity  = ActivityRecord.where(who: username).last_30_days.group_by_day
        sensitive = SensitiveDataRecord.where(accessed_by: username).count

        result = OllamaService.new.predict_user_risk({
          username: username,
          event_count: activity.values.sum,
          failed_logins: ActivityRecord.failed_logins(username),
          sensitive_accesses: sensitive,
          off_hours_events: ActivityRecord.off_hours(username),
          unique_shares: ActivityRecord.unique_shares(username),
          data_moved_gb: 0
        })

        render json: result
      end

      def query
        question     = params.require(:question)
        context_data = {
          total_users:     UserRiskScore.count,
          high_risk_users: UserRiskScore.high_risk.count,
          sensitive_files: SensitiveDataRecord.count,
          active_alerts:   Alert.active.count
        }

        answer = OllamaService.new.free_query(question, context_data)
        render json: { answer: answer }
      end
    end
  end
end
