const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

const app = express();
const port = 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// Multer configuration for file upload
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/videos/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const profilePicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profilePics/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const uploadVideo = multer({ storage: videoStorage });
const uploadProfilePic = multer({ storage: profilePicStorage });

// Routes
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.json({ message: 'Registration successful' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user._id;
      res.redirect('/'); // Redirect to home page after login
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

app.post('/upload', uploadVideo.single('video'), (req, res) => {
  if (req.session.userId) {
    res.send({ filePath: `/uploads/videos/${req.file.filename}` });
  } else {
    res.status(403).send('Not authorized');
  }
});

app.get('/videos', (req, res) => {
  const files = fs.readdirSync('uploads/videos/');
  const videoPaths = files.map(file => `/uploads/videos/${file}`);
  res.send(videoPaths);
});

// Serve HTML files
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.redirect('/login.html');
  }
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Route to check authentication status
app.get('/check-auth', (req, res) => {
  res.json({ authenticated: !!req.session.userId });
});

// Route to get the username of the authenticated user
app.get('/get-username', async (req, res) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        res.json({ username: user.username });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.status(403).json({ message: 'Not authorized' });
  }
});

// Route to get the profile picture of the authenticated user
app.get('/get-profile-pic', async (req, res) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        res.json({ profilePic: user.profilePic || '/uploads/profilePics/default-profile.png' });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.status(403).json({ message: 'Not authorized' });
  }
});

// Route to update user profile
app.post('/update-profile', uploadProfilePic.single('profilePic'), async (req, res) => {
    if (req.session.userId) {
      try {
        const { email, password, username } = req.body;
        const updates = {};
  
        if (email) updates.email = email;
        if (username) updates.username = username;
        if (password) updates.password = await bcrypt.hash(password, 10);
        if (req.file) updates.profilePic = `/uploads/profilePics/${req.file.filename}`;
  
        const user = await User.findByIdAndUpdate(req.session.userId, updates, { new: true });
        if (user) {
          res.json({ message: 'Profile updated successfully' });
        } else {
          res.status(404).json({ message: 'User not found' });
        }
      } catch (error) {
        res.status(500).json({ message: 'Server error' });
      }
    } else {
      res.status(403).json({ message: 'Not authorized' });
    }
  });  

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
