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
  const users = await User.find({ username: { $in: ["HabibUllah", "Chemestry", "Habib"] } });
  console.log("Specific users avatar info:");
  users.forEach(u => console.log(u.username, "avatar object:", u.avatar));
  process.exit(0);
}
run();
