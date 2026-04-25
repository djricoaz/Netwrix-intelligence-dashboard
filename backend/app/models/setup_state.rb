class SetupState
  include Mongoid::Document

  STEPS = %w[credentials sources integrations ai sync complete].freeze

  field :completed,     type: Boolean, default: false
  field :current_step,  type: String,  default: "credentials"
  field :completed_steps, type: Array, default: []
  field :na_configured, type: Boolean, default: false
  field :ndc_configured,type: Boolean, default: false

  index({}, { unique: true })

  def self.instance
    first_or_create!
  end

  def self.completed?       = instance.completed
  def self.current_step     = instance.current_step
  def self.complete!        = instance.update!(completed: true, current_step: "complete")

  def self.advance_to(step)
    s = instance
    s.completed_steps |= [s.current_step]
    s.update!(current_step: step)
  end

  def self.save_credentials(system, creds)
    key = system == :na ? :na_configured : :ndc_configured
    instance.update!(key => true)
    Rails.application.credentials.send(:write, system.to_s => creds)
  end
end
