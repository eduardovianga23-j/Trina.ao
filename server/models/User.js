import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    // customer = cliente · manager = gestor (só gere produtos) · admin = administrador principal (gere tudo, incluindo a equipa)
    role: { type: String, enum: ['customer', 'manager', 'admin'], default: 'customer' },
    avatar: { type: String, default: '' },
    address: {
      street: String,
      city: String,
      province: String,
      postalCode: String,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
