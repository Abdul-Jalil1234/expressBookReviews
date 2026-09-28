const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

/* ------------------------------------------------------------------
   Data-access helpers.
   Each returns a Promise so requests are handled asynchronously and
   multiple users can be served at the same time without blocking.
------------------------------------------------------------------- */
const getBooks = () => new Promise((resolve) => resolve(books));

const getBookByISBN = (isbn) =>
  new Promise((resolve, reject) => {
    if (books[isbn]) resolve(books[isbn]);
    else reject({ status: 404, message: `Book with ISBN ${isbn} not found` });
  });

const getBooksByField = (field, value) =>
  new Promise((resolve, reject) => {
    const matches = Object.keys(books)
      .filter((isbn) => books[isbn][field].toLowerCase() === value.toLowerCase())
      .map((isbn) => ({ isbn, ...books[isbn] }));
    if (matches.length > 0) resolve(matches);
    else reject({ status: 404, message: `No books found with ${field} "${value}"` });
  });

/* ------------------------------------------------------------------
   Register a new user
------------------------------------------------------------------- */
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (!isValid(username)) {
    return res.status(409).json({ message: "User already exists!" });
  }

  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

/* ------------------------------------------------------------------
   Task 2: Get the list of all books (async/await)
------------------------------------------------------------------- */
public_users.get('/', async (req, res) => {
  const allBooks = await getBooks();
  return res.status(200).send(JSON.stringify(allBooks, null, 4));
});

/* Task 3: Get book details by ISBN (async/await) */
public_users.get('/isbn/:isbn', async (req, res) => {
  try {
    const book = await getBookByISBN(req.params.isbn);
    return res.status(200).send(JSON.stringify(book, null, 4));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

/* Task 4: Get book details by author (async/await) */
public_users.get('/author/:author', async (req, res) => {
  try {
    const result = await getBooksByField("author", req.params.author);
    return res.status(200).send(JSON.stringify({ booksbyauthor: result }, null, 4));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

/* Task 5: Get book details by title (async/await) */
public_users.get('/title/:title', async (req, res) => {
  try {
    const result = await getBooksByField("title", req.params.title);
    return res.status(200).send(JSON.stringify({ booksbytitle: result }, null, 4));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

/* Task 6: Get book reviews */
public_users.get('/review/:isbn', async (req, res) => {
  try {
    const book = await getBookByISBN(req.params.isbn);
    return res.status(200).send(JSON.stringify(book.reviews, null, 4));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

/* ------------------------------------------------------------------
   Task 11: Retrieve books using Axios with Promise callbacks and
   async/await. These functions call the public endpoints above and
   are also exposed under /axios/... so they can be tested with cURL.
------------------------------------------------------------------- */

// All books — async/await with Axios
const getAllBooksAxios = async () => {
  const response = await axios.get(`${BASE_URL}/`);
  return response.data;
};

// By ISBN — Promise callbacks with Axios
const getBookByISBNAxios = (isbn) =>
  axios.get(`${BASE_URL}/isbn/${encodeURIComponent(isbn)}`).then((response) => response.data);

// By author — async/await with Axios
const getBooksByAuthorAxios = async (author) => {
  const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
  return response.data;
};

// By title — Promise callbacks with Axios
const getBooksByTitleAxios = (title) =>
  axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`).then((response) => response.data);

const axiosErrorHandler = (res) => (error) => {
  const status = error.response ? error.response.status : 500;
  const message = error.response ? error.response.data.message : error.message;
  return res.status(status).json({ message });
};

public_users.get('/axios/books', (req, res) => {
  getAllBooksAxios().then((data) => res.status(200).json(data)).catch(axiosErrorHandler(res));
});

public_users.get('/axios/isbn/:isbn', (req, res) => {
  getBookByISBNAxios(req.params.isbn).then((data) => res.status(200).json(data)).catch(axiosErrorHandler(res));
});

public_users.get('/axios/author/:author', (req, res) => {
  getBooksByAuthorAxios(req.params.author).then((data) => res.status(200).json(data)).catch(axiosErrorHandler(res));
});

public_users.get('/axios/title/:title', (req, res) => {
  getBooksByTitleAxios(req.params.title).then((data) => res.status(200).json(data)).catch(axiosErrorHandler(res));
});

module.exports.general = public_users;
module.exports.getAllBooksAxios = getAllBooksAxios;
module.exports.getBookByISBNAxios = getBookByISBNAxios;
module.exports.getBooksByAuthorAxios = getBooksByAuthorAxios;
module.exports.getBooksByTitleAxios = getBooksByTitleAxios;
