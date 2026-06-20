import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash:  { type: String, required: true },
    role:          { type: String, enum: ['super_admin', 'manager', 'employee'], default: 'employee' },
    department:    { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    designation:   { type: String, default: '' },
    phone:         { type: String, default: '' },
    avatar:        { type: String, default: '' },
    dateOfJoining: { type: Date, default: Date.now },
    isActive:      { type: Boolean, default: true },
    refreshToken:  { type: String, default: null },
    leaveQuota: {
      annual:    { type: Number, default: 15 },
      sick:      { type: Number, default: 10 },
      emergency: { type: Number, default: 5 },
    },
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

export default mongoose.model('User', userSchema);
