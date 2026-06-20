import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    department:  { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deadline:    { type: Date },
    status:      { type: String, enum: ['active', 'completed', 'on-hold'], default: 'active' },
    progress:    { type: Number, default: 0, min: 0, max: 100 },
    members:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
