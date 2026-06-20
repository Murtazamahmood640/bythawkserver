import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status:      { type: String, enum: ['todo', 'in_progress', 'review', 'completed'], default: 'todo' },
    dueDate:     { type: Date },
    tags:        [String],
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
