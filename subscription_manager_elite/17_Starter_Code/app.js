const express = require('express');
const app = express();
app.use(express.json());

let subscriptions = [];

app.post('/subscriptions', (req, res) => {
  const sub = { id: 'sub_' + Date.now(), ...req.body };
  subscriptions.push(sub);
  res.json(sub);
});

app.get('/subscriptions', (req, res) => {
  res.json(subscriptions);
});

app.listen(3000, () => console.log('Server running on port 3000'));
