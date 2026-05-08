const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: "https://spincontest.netlify.app"
}));

// MongoDB Connection (Local Database)
mongoose.connect('mongodb+srv://santhoshkumarat2004_db_user:wPGdASnfr9e8LeO0@cluster0.7ul8num.mongodb.net/?appName=Cluster0')
.then(() => console.log("MongoDB Connected! ✅"))
.catch(err => console.error("MongoDB Connection Error ❌:", err));

// --- SCHEMAS ---

// User details and spin history 
const UserSchema = new mongoose.Schema({
    name: String,
    mobile: { type: String, unique: true },
    total: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    spins: [{
        day: Number,
        slot: String,
        val: Number,
        timestamp: { type: Date, default: Date.now }
    }]
});
const User = mongoose.model('User', UserSchema);

// 
const SettingsSchema = new mongoose.Schema({
    startDate: String,
    morning: { start: String, end: String },
    evening: { start: String, end: String }
});
const Settings = mongoose.model('Settings', SettingsSchema);

// --- API ENDPOINTS ---

// 1. LOGIN / REGISTER API
app.post('/api/login', async (req, res) => {
    try {
        const { name, mobile } = req.body;
        let user = await User.findOne({ mobile });
        
        if (!user) {
            // New user-a create pannu
            user = new User({ name, mobile });
            await user.save();
            console.log(`New user registered: ${name}`);
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

// 2. SAVE SPIN DATA API
app.post('/api/spin', async (req, res) => {
    try {
        const { mobile, winVal, day, slot } = req.body;
        const user = await User.findOne({ mobile });

        if (user) {
            user.total += winVal;
            user.count += 1;
            user.spins.push({ day, slot, val: winVal });
            await user.save();
            res.json({ message: "Spin saved!", user });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to save spin" });
    }
});

// 3. GET ALL USERS (Admin Dashboard-kku)
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch users" });
    }
});

// 4. GET ADMIN SETTINGS
app.get('/api/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            // Initial/Default Settings if DB is empty
            settings = {
                startDate: new Date().toISOString().split('T')[0],
                morning: { start: "11:00", end: "16:00" },
                evening: { start: "16:00", end: "23:59" }
            };
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch settings" });
    }
});

// 5. UPDATE ADMIN SETTINGS
app.post('/api/settings', async (req, res) => {
    try {
        const newSettings = req.body;
        //
        await Settings.findOneAndUpdate({}, newSettings, { upsert: true });
        res.json({ message: "Settings updated successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update settings" });
    }
});

// --- SERVER START ---
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.send("Backend is running successfully");
});

app.listen(PORT, () => {
    console.log(`🚀 Smart Reach Backend running on port ${PORT}`);
});