// Source - https://jsinthebits.com/handling-authentication-in-express-js-29a27ed5/

const crypto = require('crypto');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// Settings
const PORT = 3000;

// Init Express
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Helpers
const getHashedPassword = (password) => {
  const sha256 = crypto.createHash('sha256');
  const hash = sha256.update(password).digest('base64');
  return hash;
};

const generateAuthToken = () => {
  return crypto.randomBytes(30).toString('hex');
};

// Model
const users = [
  {
    email: 'admin',
    // This is the SHA256 hash for value of `123`
    password: 'pmWkWSBCL51Bfkhn79xPuKBKHz//H6B+mY6G9/eieuM=',
  },
];

const authTokens = {};

// Middlewares
app.use((req, res, next) => {
  // Get auth token from the cookies
  const cookieToken = req.cookies['AuthToken'];

  // Inject the user to the request
  req.user = authTokens[cookieToken];

  next();
});

const requireAuth = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.status(401).render('pages/login');
  }
};

// Routes
app.get('/', (req, res) => {
  res.render('pages/home', {
    title: 'Main page',
    text: 'This is main page',
  });
});

app.get('/register', (req, res) => {
  res.render('pages/register');
});

app.get('/login', (req, res) => {
  res.render('pages/login');
});

app.get('/admin', requireAuth, (req, res) => {
  res.render('pages/admin', {
    users,
    tokens: JSON.stringify(authTokens, null, 2),
  });
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;

  // Chack is user data exists
  if (!email || !password) {
    res.redirect('/');
  }

  // create hashedPassword
  const hashedPassword = getHashedPassword(password);

  // Store user into database
  users.push({
    email,
    password: hashedPassword,
  });

  // render login page
  res.redirect('/login');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = getHashedPassword(password);

  const user = users.find((u) => {
    return u.email === email && hashedPassword === u.password;
  });

  if (user) {
    const authToken = generateAuthToken();

    // Store authentication token
    authTokens[authToken] = user;

    // Setting the auth token in cookies
    res.cookie('AuthToken', authToken);

    // Redirect user to the protected page
    res.redirect('/admin');
  } else {
    // Render Login page
    res.status(401).render('pages/login');
  }
});

// Run server
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
