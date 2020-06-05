require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const { v4: uuid } = require('uuid');

const app = express();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';


function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get('Authorization');

  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }

  next();
}

app.use(morgan(morganOption));
app.use(express.json());
app.use(cors());
app.use(helmet());

let address = [];

app.get('/address', (req, res) => {
  res
    .json(address);
});

app.post('/address', validateBearerToken, (req, res) => {
  const { firstName, lastName, address1, address2 = false, city, state, zip } = req.body;

  const inputs = ['firstName', 'lastName', 'address1', 'city', 'state', 'zip'];
  inputs.forEach(input => {
    if (!`${input}`) {
      return res
        .status(400)
        .send(`${input} is required`);
    }
  });

  if (state.length !== 2)
    return res
      .status(400)
      .send('State must be exactly two characters');


  if (Number(zip) === isNaN || zip.length !== 5) {
    return res
      .status(400)
      .send('Zip code must be a five-digit number');
  }

  const id = uuid();
  const newAddress = {
    id,
    firstName,
    lastName,
    address1,
    address2,
    city,
    state,
    zip
  };

  address.push(newAddress);

  // at this point all validation passed
  res
    .status(201)
    .location(`http://localhost:8000/address/${id}`)
    .json(newAddress);

});

app.delete('/address/:addressId', validateBearerToken, (req, res) => {
  const { addressId } = req.params;
  const index = address.findIndex(u => u.id === addressId);

  if (index === -1) {
    return res
      .status(404)
      .send('Address not found');
  }

  address.splice(index, 1);

  res
    .status(204)
    .end();
});



app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
    response = { message: error.message, error };
  }
  res.status(500).json(response);
})




module.exports = app;