app.get('/shopify/callback', (req, res) => {
  const { shop, hmac, code, state } = req.query;
  console.log(req.query);

  const stateCookie = cookie.parse(req.headers.cookie).state;

  console.log('stateCookie is', stateCookie);

  console.log('shop is', shop);
  console.log('hmac is', hmac);
  console.log('code is', code);
  console.log('state is', state);

  if (state !== stateCookie) {
    return res.status(403).send('Request origin cannot be verified');
  }

  if (shop && hmac && code) {
    // DONE: Validate request is from Shopify
    const map = Object.assign({}, req.query);

    console.log('map is querry',map);

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
    
    console.log('provided hmac', providedHmac);
    console.log('generated Hash', generatedHash);
    let hashEquals = false;

    try {
      hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac)
    } catch (e) {
      hashEquals = false;
    };

    if (!hashEquals) {
      return res.status(400).send('HMAC validation failed');
    }

    res.status(200).send('HMAC validated');
    // TODO
    // Exchange temporary code for a permanent access token
      // Use access token to make API call to 'shop' endpoint
  } else {
    res.status(400).send('Required parameters missing');
  }
});