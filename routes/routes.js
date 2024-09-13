const express = require('express');
const { db, auth } = require('../firebase/firebase-config');
const router = express.Router();

const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
};

router.get('/', (req, res) => {
  res.render('index');
});

router.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

router.post('/signup', async (req, res) => {
  const { email, password, bloodGroup } = req.body;
  try {
    const user = await auth.createUser({ email, password });
    await db.collection('users').doc(user.uid).set({
      email,
      bloodGroup,
      requests: []
    });
    res.redirect('/login');
  } catch (error) {
    res.render('signup', { error: error.message });
  }
});

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await auth.getUserByEmail(email);
    req.session.userId = user.uid;
    res.redirect('/dashboard');
  } catch (error) {
    res.render('login', { error: error.message });
  }
});

router.get('/dashboard', isAuthenticated, async (req, res) => {
  const userDoc = await db.collection('users').doc(req.session.userId).get();
  const user = userDoc.data();
  res.render('dashboard', { user });
});

router.get('/request', isAuthenticated, (req, res) => {
  res.render('request');
});

router.post('/request', isAuthenticated, async (req, res) => {
  const { bloodGroup, message } = req.body;
  const requestId = db.collection('requests').doc().id;
  await db.collection('requests').doc(requestId).set({
    requesterId: req.session.userId,
    bloodGroup,
    message,
    status: 'Pending'
  });
  res.redirect('/dashboard');
});

router.get('/respond', isAuthenticated, async (req, res) => {
  const userDoc = await db.collection('users').doc(req.session.userId).get();
  const user = userDoc.data();
  const requestsSnapshot = await db.collection('requests').where('bloodGroup', '==', user.bloodGroup).get();
  const requests = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.render('respond', { requests });
});

router.post('/respond/:id', isAuthenticated, async (req, res) => {
  const requestId = req.params.id;
  await db.collection('requests').doc(requestId).update({
    status: 'Accepted',
    responderId: req.session.userId
  });
  res.redirect('/dashboard');
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
