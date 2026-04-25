class EventsChannel < ApplicationCable::Channel
  def subscribed
    stream_from "events_channel"
  end

  def unsubscribed
  end
end
