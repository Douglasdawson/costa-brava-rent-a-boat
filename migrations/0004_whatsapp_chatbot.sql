-- WhatsApp Chatbot Conversations Table
-- Stores the state and context of each WhatsApp conversation

CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL,
  current_state VARCHAR(50) NOT NULL DEFAULT 'welcome',
  language VARCHAR(5) NOT NULL DEFAULT 'es',
  context JSONB DEFAULT '{}',

  -- Booking flow data (stored during conversation)
  selected_boat_id VARCHAR(50),
  selected_date TIMESTAMP WITH TIME ZONE,
  selected_start_time VARCHAR(10),
  selected_duration VARCHAR(10),
  selected_extras TEXT[],
  customer_name VARCHAR(100),
  customer_email VARCHAR(100),
  number_of_people INTEGER,

  -- Tracking
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  messages_count INTEGER NOT NULL DEFAULT 0,

  -- Reference to created booking (if any)
  created_booking_id UUID REFERENCES bookings(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS chatbot_phone_idx ON chatbot_conversations(phone_number);
CREATE INDEX IF NOT EXISTS chatbot_state_idx ON chatbot_conversations(current_state);
CREATE INDEX IF NOT EXISTS chatbot_last_message_idx ON chatbot_conversations(last_message_at);

-- Comment
COMMENT ON TABLE chatbot_conversations IS 'WhatsApp chatbot conversation state and booking flow data';
