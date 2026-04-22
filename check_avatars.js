const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  username: String,
  avatar: {
    public_id: String,
    url: String
  }
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({ "avatar.url": { $ne: "" }, "avatar.url": { $ne: null } }).limit(5);
  console.log("Users with non-empty avatar URLs:");
  users.forEach(u => console.log(u.username, u.avatar?.url));
  process.exit(0);
}
run();
