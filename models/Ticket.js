import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    raisedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category:    { type: String, enum: ['it', 'hr', 'admin', 'other'], default: 'other' },
    priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status:      { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
    assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolution:  { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Ticket', ticketSchema);
