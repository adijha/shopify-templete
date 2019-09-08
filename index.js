const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const crypto = require('crypto');
const cookie = require('cookie');
const nonce = require('nonce')();
const querystring = require('querystring');
const request = require('request-promise');

const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;
const scopes = 'read_products';
const forwardingAddress = 'https://b3ca6d9f.ngrok.io'; // Replace this with your HTTPS Forwarding address

//send index.html file through response
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/frontend/index.html`);
});

//install route
app.get('/shopify', (req, res) => {
  const shop = req.query.shop;
  if (shop) {
    const state = nonce();
    console.log('state comes from nonce', state);

    const redirectUri = forwardingAddress + '/shopify/callback';
    const installUrl =
      'https://' +
      shop +
      '/admin/oauth/authorize?client_id=' +
      apiKey +
      '&scope=' +
      scopes +
      '&state=' +
      state +
      '&redirect_uri=' +
      redirectUri;

    console.log('redirect uri', redirectUri);
    console.log('install uri', installUrl);

    res.cookie('state', state);
    console.log('cookie', req.cookies);

    res.redirect(installUrl);
    console.log('installUrl req.redirect', req.redirect);
  } else {
    return res
      .status(400)
      .send(
        'Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request'
      );
  }
});

//callback route
app.get('/shopify/callback', (req, res) => {
  const { shop, hmac, code, state } = req.query;
  const stateCookie = cookie.parse(req.headers.cookie).state;

  if (state !== stateCookie) {
    return res.status(403).send('Request origin cannot be verified');
  }

  if (shop && hmac && code) {
    // DONE: Validate request is from Shopify
    const map = Object.assign({}, req.query);
    delete map['signature'];
    delete map['hmac'];
    const message = querystring.stringify(map);
    const providedHmac = Buffer.from(hmac, 'utf-8');
    const generatedHash = Buffer.from(
      crypto
        .createHmac('sha256', apiSecret)
        .update(message)
        .digest('hex'),
        'utf-8'
    );
    // console.log(code);
    
    let hashEquals = false;
      
    try {
      hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac)
    } catch (e) {
      hashEquals = false;
    };

    if (!hashEquals) {
      return res.status(400).send('HMAC validation failed');
    }

    // DONE: Exchange temporary code for a permanent access token
    const accessTokenRequestUrl = 'https://' + shop + '/admin/oauth/access_token';
    const accessTokenPayload = {
      client_id: apiKey,
      client_secret: apiSecret,
      code,
    };
    // console.log(code);
    request.post(accessTokenRequestUrl, { json: accessTokenPayload })
    .then((accessTokenResponse) => {
      const accessToken = accessTokenResponse.access_token;

      res.status(200).send("Got an access token, let's do something with it");
      // TODO
      // Use access token to make API call to 'shop' endpoint
    })
    .catch((error) => {
      res.status(error.statusCode).send(error.error.error_description);
    });

  } else {
    res.status(400).send('Required parameters missing');
  }
});
app.listen(5000, () => {
  console.log('Example app listening on port 3000!');
});
