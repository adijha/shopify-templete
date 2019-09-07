require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

//init express app and bodyparser
const app = express();
app.use(
  bodyParser.urlencoded({
    extended: false
  }).json()
);

//send index.html file through response
app.get('/', (request, response) =>
  response.sendFile(`${__dirname}/frontend/index.html`)
);

// hearing post Request to this app
app.post('/', (request, response) => {
  const postBody = request.body.data;
  console.log(postBody);

  const text = new GoGo({
    data: postBody
  });
  text.save(function(err) {
    if (err) {
      console.log(err);
    } else {
      response.redirect('/');
    }
  });
});

//make post request to other endpoint (It's fake rest api implemetation to create employee data)
app.post('http://dummy.restapiexample.com/api/v1/create', function(request, response) {
  response.send({
    id: '148862',
    employee_name: 'mmm',
    employee_salary: '111',
    employee_age: '111',
    profile_image: ''
  });
});

//listen app on 9000 port
app.listen(9000, () =>
  console.info(
    '==>🌎 Listening on port 3000. Open up http://localhost:9000/ in your browser 🎈🎈.'
  )
);
