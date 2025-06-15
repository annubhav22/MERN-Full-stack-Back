const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({ 
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

userSchema.virtual('id').get(function () {
  return this._id.toString();
});

// omit password from toJSON
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.passwordHash;
    delete ret.__v;
  }
});

exports.User = mongoose.model('User', userSchema);
