const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// Returns true if the username is not already taken
const isValid = (username) => {
  return !users.some((user) => user.username === username);
};

// Returns true if username and password match a registered user
const authenticatedUser = (username, password) => {
  return users.some((user) => user.username === username && user.password === password);
};

// Login as a registered user
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid login. Check username and password" });
  }

  const accessToken = jwt.sign({ data: password }, "access", { expiresIn: 60 * 60 });
  req.session.authorization = { accessToken, username };

  return res.status(200).json({ message: "User successfully logged in" });
});

// Add or modify a book review (logged in users only)
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }
  if (!review) {
    return res.status(400).json({ message: "A review is required (use ?review=...)" });
  }

  const isUpdate = books[isbn].reviews[username] !== undefined;
  books[isbn].reviews[username] = review;

  return res.status(200).json({
    message: `The review for the book with ISBN ${isbn} has been ${isUpdate ? "modified" : "added"} successfully.`,
    reviews: books[isbn].reviews
  });
});

// Delete a book review (users can delete only their own review)
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }
  if (books[isbn].reviews[username] === undefined) {
    return res.status(404).json({ message: "You have no review on this book to delete" });
  }

  delete books[isbn].reviews[username];

  return res.status(200).json({
    message: `Review for the ISBN ${isbn} posted by the user ${username} deleted.`
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
