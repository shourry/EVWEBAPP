const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'evconnect-secret-key';
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, '[]', 'utf8');
}

const readUsers = () => {
  const raw = fs.readFileSync(USERS_FILE, 'utf8');
  return JSON.parse(raw || '[]');
};

const saveUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
};

const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
    expiresIn: '7d'
  });
};

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname)));

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }
  const users = readUsers();
  const existing = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ message: 'Email is already registered.' });
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: Date.now(),
    name,
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  saveUsers(users);
  const token = generateToken(newUser);
  res.status(201).json({
    message: 'Registration successful',
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    }
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  const users = readUsers();
  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  const token = generateToken(user);
  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
});

app.post('/api/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/profile', authenticate, (req, res) => {
  const users = readUsers();
  const user = users.find((item) => item.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  res.json({ id: user.id, name: user.name, email: user.email });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`EV Connect backend running on http://localhost:${PORT}`);
});
