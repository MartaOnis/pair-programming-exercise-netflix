const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const { query } = require('express');
const db = new Database('./src/db/database.db', { verbose: console.log });

// create and config server
const server = express();
server.use(cors());
server.use(
  express.json({
    limit: '25mb',
  })
);

// template engines
server.set('view engine', 'ejs');

// init express aplication
const serverPort = 4000;
server.listen(serverPort, () => {
  console.log(`Server listening at http://localhost:${serverPort}`);
});

server.get('/movies', (req, resp) => {
  // console.log('consoleando', response);
  console.log('Ver las query params', req.query.gender);
  let response = [];
  if (req.query.gender === '') {
    const query = db.prepare(`SELECT * FROM movies ORDER BY title DESC`);
    response = query.all();
  } else {
    const query = db.prepare(
      `SELECT *FROM movies  WHERE gender =? ORDER BY title DESC`
    );
    response = query.all(req.query.gender);
  }
  // const genderFilterParam = movieData.filter((movie) => {
  //   if (req.query.gender === '') {
  //     return true;
  //   } else {
  //     return movie.gender === req.query.gender;
  //   }
  // });
  // const response = {
  //   success: true,
  //   movies: genderFilterParam,
  // };
  resp.json({
    success: true,
    movies: response,
  });
});

server.post('/login', (req, resp) => {
  console.log(req.body);
  const queryUsers = db.prepare(
    `SELECT * FROM users WHERE  email = ?  AND  password = ?`
  );
  const oneUser = queryUsers.get(req.body.email, req.body.password);
  console.log('Esto es oneUser', oneUser);

  // const oneUser = users
  //   .find((user) => user.email === req.body.email)
  //   .find((user) => user.password === req.body.password);
  if (oneUser) {
    resp.json({ success: true, userId: oneUser.id });
  } else {
    resp.json({ success: false, errorMessage: 'Usuaria/o no encontrada/o' });
  }
});

server.post('/sign-up', (req, resp) => {
  console.log('LLegan por body al sign-up', req.body);
  const queryUniqueEmail = db.prepare(`SELECT * FROM users WHERE email = ? `);
  const checkMail = queryUniqueEmail.get(req.body.email);

  if (checkMail) {
    resp.json({ success: false, errorMessage: 'Usuaria ya existente' });
  } else {
    const querySignUp = db.prepare(
      `INSERT INTO users (email, password) VALUES (?, ?)`
    );
    const result = querySignUp.run(req.body.email, req.body.password);
    console.log('Que es result', result);
    if (result) {
      resp.json({
        success: true,
        userId: `nuevo-id-añadido, el id es: ${result.lastInsertRowid} `,
      });
    } else {
      resp.json({
        success: false,
        errorMessage: 'Tienes que rellenar todos los campos',
      });
    }
  }
});

server.post('/user/profile', (req, resp) => {
  console.log('Esto deberia de ser el userid', req.headers);

  //queda punto 5 de BD II!!!!!!
});

server.get('/movie/:movieId', (req, res) => {
  const query = db.prepare(`SELECT * FROM movies WHERE id = ?`);
  const movieId = query.get(req.params.movieId);
  //const foundMovie = movieData.find(
  //(oneMovie) => oneMovie.id === req.params.movieId
  //);
  //console.log(foundMovie);
  res.render('movie', movieId);
});

// server.get('/user/movies', (req, res) => {
//   res.json({
//     success: true,
//     movies: [],
//   });
// });

server.get('/my-movies', (req, res) => {
  // preparamos la query para obtener los movieIds
  const movieIdsQuery = db.prepare(
    'SELECT movieId FROM rel_movies_users WHERE userId = ?'
  );
  // obtenemos el id de la usuaria
  const userId = req.header('user-id');
  console.log('El id que está llegando', userId);
  // ejecutamos la query
  const movieIds = movieIdsQuery.all(userId); // que nos devuelve algo como [{ movieId: 1 }, { movieId: 2 }];

  // obtenemos las interrogaciones separadas por comas
  const moviesIdsQuestions = movieIds.map((id) => '?').join(', '); // que nos devuelve '?, ?'
  // preparamos la segunda query para obtener todos los datos de las películas
  const moviesQuery = db.prepare(
    `SELECT * FROM movies WHERE id IN (${moviesIdsQuestions})`
  );

  // convertimos el array de objetos de id anterior a un array de números
  const moviesIdsNumbers = movieIds.map((movie) => movie.movieId); // que nos devuelve [1.0, 2.0]
  // ejecutamos segunda la query
  const movies = moviesQuery.all(moviesIdsNumbers);

  // respondemos a la petición con
  res.json({
    success: true,
    movies: movies,
  });
});

// static servers
const staticServer = './src/public-react';
server.use(express.static(staticServer));

const staticServerImages = './src/public-movies-images';
server.use(express.static(staticServerImages));

const staticServerStyles = './src/public-css';
server.use(express.static(staticServerStyles));
