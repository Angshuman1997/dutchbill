const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./router/UserRoute');
const adminRoutes = require('./router/AdminRoute');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/api', userRoutes);
app.use('/api', adminRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
