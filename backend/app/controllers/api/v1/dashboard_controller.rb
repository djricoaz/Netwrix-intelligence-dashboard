module Api
  module V1
    class DashboardController < ApplicationController
      # GET /api/v1/dashboard/summary
      # Returns global KPI summary, adapts to configured data sources
      def summary
        config = Netwrix::SourceDiscovery.cached

        summary = { configured_modules: config[:modules] }
        summary[:ad]         = Ad::KpiAggregator.summary       if config.dig(:modules, :ad)
        summary[:entra]      = Entra::KpiAggregator.summary    if config.dig(:modules, :entra)
        summary[:fileserver] = Fileserver::KpiAggregator.summary if config.dig(:modules, :fileserver)
        summary[:sharepoint] = Sharepoint::KpiAggregator.summary if config.dig(:modules, :sharepoint)
        summary[:exchange]   = Exchange::KpiAggregator.summary  if config.dig(:modules, :exchange)
        summary[:teams]      = Teams::KpiAggregator.summary     if config.dig(:modules, :teams)

        render json: summary
      end

      # GET /api/v1/dashboard/kpis
      # Global KPI cards across all active modules
      def kpis
        config  = Netwrix::SourceDiscovery.cached
        modules = config[:modules].select { |_, v| v }.keys

        kpis = modules.each_with_object({}) do |mod, acc|
          acc[mod] = KpiAggregator.for_module(mod)
        end

        render json: {
          kpis: kpis,
          global_breach_score: BreachScoreCalculator.global,
          last_updated: Time.current.iso8601
        }
      end

      # GET /api/v1/dashboard/breach_score
      def breach_score
        render json: BreachScoreCalculator.detailed
      end

      # GET /api/v1/dashboard/alerts
      def alerts
        config = Netwrix::SourceDiscovery.cached
        active_modules = config[:modules].select { |_, v| v }.keys

        alerts = Alert.active
                      .where(:module.in => active_modules.map(&:to_s))
                      .order(severity: :desc, created_at: :desc)
                      .limit(100)

        render json: alerts
      end
    end
  end
end
