/*********************************************************************************
 * WEB422 – Assignment 01
 *
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy.
 * No part of this assignment has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 *
 * Name: Muhammad Ahmed
 * Student ID: 146908207
 * Date: 09-15-2022
 *
 * Cyclic Link: _______________________________________________________________
 ********************************************************************************/

const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
const multer = require('multer');
const upload = multer();
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const clientSessions = require('client-sessions');
const stripJs = require('strip-js');
const path = require('path');
const blogData = require(path.join(__dirname, '/blog-service'));
const authData = require(path.join(__dirname, '/auth-service'));

cloudinary.config({
  cloud_name: 'mahmed224',
  api_key: '737634465147813',
  api_secret: 'A1wBCHv3PWT1vOxEy9hZRYVYczU',
  secure: true,
});

const HTTP_PORT = process.env.PORT || 8080;

// call this function after the http server starts listening for requests
const onHttpStart = () => {
  console.log(`Express http server listening on ${HTTP_PORT}`);
};

// tells server how to handle HTML files that are formatted using handlebars by defining any file with the “.hbs” extension (instead of “.html”) to use the handlebars “engine” (template engine)
app.engine(
  '.hbs',
  exphbs.engine({
    extname: '.hbs',
    helpers: {
      formatDate: function (dateObj) {
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString();
        let day = dateObj.getDate().toString();

        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      },
      navLink: function (url, options) {
        return (
          '<li' +
          (url == app.locals.activeRoute ? ' class="active" ' : '') +
          '><a href="' +
          url +
          '">' +
          options.fn(this) +
          '</a></li>'
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3) throw new Error('Handlebars Helper equal needs 2 parameters');
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      safeHTML: function (context) {
        return stripJs(context);
      },
    },
  })
);
app.set('view engine', '.hbs');

// the static folder that static resources, like images and css files, can load from
app.use(express.static(path.join(__dirname, '/public')));
// set the middleware for “urlencoded” form data (normal HTTP Post data)
app.use(express.urlencoded({ extended: true }));
// will add the property 'activeRoute' to 'app.locals' whenever the route changes, ie: if our route is '/blog/5', the app.locals.activeRoute value will be '/blog'. Also, if the blog is currently viewing a category, that category will be set in 'app.locals'.
app.use((req, res, next) => {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    '/' + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, '') : route.replace(/\/(.*)/, ''));
  app.locals.viewingCategory = req.query.category;
  next();
});
// Setup client-sessions
app.use(
  clientSessions({
    cookieName: 'session', // this is the object name that will be added to 'req'
    secret: 'sacrifice_earth_crow_risk_electrification_telepathy', // this should be a long un-guessable string.
    duration: 5 * 60 * 1000, // duration of the session in milliseconds (5 minutes)
    activeDuration: 3 * 1000 * 60, // the session will be extended by this many milliseconds, after each request made (3 minutes)
  })
);
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// this is a helper middleware function that checks if a user is logged in and will be used in any route that should be protected against unauthenticated access
// a more advanced version of this would include checks for authorization as well, after checking if the user is authenticated
const ensureLogin = (req, res, next) => {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
};

/* ----- SERVER ROUTES ----- */
// setup a 'route' to listen on the default/origin url path (http:/ / localhost/)
app.get('/', (req, res) => {
  res.redirect('/blog');
});

// about page route
app.get('/about', (req, res) => {
  res.render('about');
});

// blog page routes
app.get('/blog', async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogData.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogData.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest post from the front of the list (element 0)
    let post = posts[0];

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;
    viewData.post = post;
    // console.log(viewData.posts); // test to see if the correct posts is being returned in "posts" array
    // console.log(viewData.post); // test to see if the first post is being returned
  } catch (err) {
    viewData.message = err;
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blogData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = err;
  }

  // render the "blog" view with all of the data (viewData)
  res.render('blog', {
    data: viewData,
  });
});

app.get('/blog/:id', async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogData.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogData.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // store the "posts" data in the viewData object (to be passed to the view)
    viewData.posts = posts;
    // console.log(viewData.posts); // test to see if the correct posts is being returned in "posts" array
  } catch (err) {
    viewData.message = err;
  }

  try {
    // Obtain the post by "id" and store the post in the viewData object (to be passed to the view)
    viewData.post = await blogData.getPostByID(req.params.id);
    // console.log(viewData.post); // test to see if the correct post is being returned
  } catch (err) {
    viewData.message = err;
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blogData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = err;
  }

  // render the "blog" view with all of the data (viewData)
  res.render('blog', {
    data: viewData,
  });
});

// posts routes
app.get('/posts', ensureLogin, (req, res) => {
  if (req.query.category) {
    blogData
      .getPostsByCategory(req.query.category)
      .then((filteredPosts) => {
        if (filteredPosts.length > 0) {
          res.render('posts', {
            posts: filteredPosts,
          });
        } else {
          res.render('posts', {
            message: `NOTE: No posts exist for the specified category.`,
          });
        }
      })
      .catch((err) => {
        res.render('posts', {
          message: err,
        });
      });
  } else if (req.query.minDate) {
    blogData
      .getPostsByMinDate(req.query.minDate)
      .then((filteredPosts) => {
        if (filteredPosts.length > 0) {
          res.render('posts', {
            posts: filteredPosts,
          });
        } else {
          res.render('posts', {
            message: `NOTE: No posts exist for the specified minimum upload date.`,
          });
        }
      })
      .catch((err) => {
        res.render('posts', {
          message: err,
        });
      });
  } else {
    blogData
      .getAllPosts()
      .then((posts) => {
        if (posts.length > 0) {
          res.render('posts', {
            posts: posts,
          });
        } else {
          res.render('posts', {
            message: `NOTE: No posts exist.`,
          });
        }
      })
      .catch((err) => {
        res.render('posts', {
          message: err,
        });
      });
  }
});

app.get('/post/:id', ensureLogin, (req, res) => {
  blogData
    .getPostByID(req.params.id)
    .then((postByID) => {
      res.json(postByID);
    })
    .catch((err) => {
      res.json({
        message: err,
      });
    });
});

app.post('/posts/add', ensureLogin, upload.single('featureImage'), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
      return result;
    }

    upload(req).then((uploaded) => {
      processPost(uploaded.url);
    });
  } else {
    processPost('');
  }

  function processPost(imageUrl) {
    req.body.featureImage = imageUrl;
    // processes the req.body and adds it as a new Blog Post before redirecting to '/posts'
    blogData
      .addPost(req.body)
      .then(() => {
        res.redirect('/posts');
      })
      .catch((err) => {
        res.send('<h1>POST COULD NOT BE MADE AT THIS TIME. PLEASE TRY AGAIN LATER</h1>');
      });
  }
});

app.get('/posts/add', ensureLogin, (req, res) => {
  blogData
    .getCategories()
    .then((categories) => {
      res.render('add-post', {
        categories: categories,
      });
    })
    .catch((err) => {
      console.log(err);
      res.render('add-post', {
        categories: [],
      });
    });
});

app.get('/posts/delete/:id', ensureLogin, (req, res) => {
  blogData
    .deletePostByID(req.params.id)
    .then((msg) => {
      console.log(msg);
      res.redirect('/posts');
    })
    .catch((err) => {
      console.log(err);
      // res.status(500).send(`Unable to remove the specified post, with the id '${req.params.id}'. The specified post may not exist.`);
      res.status(500).send(`Unable to Remove Post / Post not found)`);
    });
});

// post categories routes
app.get('/categories', ensureLogin, (req, res) => {
  blogData
    .getCategories()
    .then((categories) => {
      if (categories.length > 0) {
        res.render('categories', {
          categories: categories,
        });
      } else {
        res.render('categories', {
          message: `NOTE: No categories exist.`,
        });
      }
    })
    .catch((err) => {
      res.render('categories', {
        message: err,
      });
    });
});

app.post('/categories/add', ensureLogin, upload.single('featureImage'), (req, res) => {
  // processes the req.body and adds it as a new Blog Post before redirecting to '/categories'
  blogData
    .addCategory(req.body)
    .then(() => {
      res.redirect('/categories');
    })
    .catch((err) => {
      res.send('<h1>CATEGORY COULD NOT BE MADE AT THIS TIME. PLEASE TRY AGAIN LATER</h1>');
    });
});

app.get('/categories/add', ensureLogin, (req, res) => {
  res.render('add-category');
});

app.get('/categories/delete/:id', ensureLogin, (req, res) => {
  blogData
    .deleteCategoryByID(req.params.id)
    .then((msg) => {
      console.log(msg);
      res.redirect('/categories');
    })
    .catch((err) => {
      console.log(err);
      // res.status(500).send(`Unable to remove the specified category, with the id '${req.params.id}'. The specified category may not exist.`);
      res.status(500).send(`Unable to Remove Category / Category not found)`);
    });
});

// user login routes
app.post('/login', (req, res) => {
  req.body.userAgent = req.get('User-Agent');

  authData
    .checkUser(req.body)
    .then((user) => {
      req.session.user = {
        username: user.username, // authenticated user's userName
        email: user.email, // authenticated user's email
        loginHistory: user.loginHistory, // authenticated user's loginHistory
      };

      res.redirect('/posts');
    })
    .catch((err) => {
      res.render('login', {
        errorMessage: err,
        username: req.body.username,
      });
    });
});

app.get('/login', (req, res) => {
  res.render('login');
});

// user registration routes
app.post('/register', (req, res) => {
  authData
    .registerUser(req.body)
    .then((msg) => {
      res.render('register', {
        successMessage: msg,
      });
    })
    .catch((err) => {
      res.render('register', {
        errorMessage: err,
        username: req.body.username,
      });
    });
});

app.get('/register', (req, res) => {
  res.render('register');
});

// logs user out by destroying their session and redirects to the default/origin route
app.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('user-history');
});

/* 
This use() will not allow requests to go beyond it so we place it at the end of the file, after the other routes. This function will catch all other requests that don't match any other route handlers declared before it. This means we can use it as a sort of 'catch all' when no route match is found. We use this function to handle 404 requests to pages that are not found.
*/
app.use((req, res) => {
  res.status(404).render('not-found');
});

/* ----- CODE TO START THE SERVER ----- */
// If data is initialized successfully in the 'blog-service' module, the promise resolves and the server is started
blogData
  .initialize()
  .then(authData.initialize())
  .then(() => {
    // setup http server to listen on HTTP_PORT
    app.listen(HTTP_PORT, onHttpStart);
  })
  .catch((err) => {
    console.log(`ERROR: Unable to start server. The system has responded with: \n${err}`);
  });
