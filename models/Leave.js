import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    employee:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type:       { type: String, enum: ['annual', 'sick', 'emergency', 'unpaid'], required: true },
    startDate:  { type: Date, required: true },
    endDate:    { type: Date, required: true },
    reason:     { type: String, required: true },
    status:     { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewNote: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Leave', leaveSchema);
