// backend/index.js
const express = require('express');
const app = express();
const data = require('./model.json')
const bin = require('./')
// const db = require('./config/db.config');
// const userRoutes = require('./routes/user.routes');
// const accountRoutes = require('./routes/account.routes');

var cors = require('cors')

app.use(cors())

app.use(express.json());
app.get('/',(req, res)=>{
    res.send("Hello World!!!");
})
app.get('/model',(req, res)=>{
    console.log(typeof data)
 res.json(data);
 
})
// app.get('/group1-shard1of1.bin',(req, res)=>{
//     res.send(JSON.stringify(data));
//    })

app.get('/group1-shard1of1.bin', (req, res) => {
  // Logic to handle the download
  const file = __dirname+ '/group1-shard1of1.bin';
  res.download(file, 'group1-shard1of1.bin');
});


// app.use('/users', userRoutes);
// app.use('/accounts', accountRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));