# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

### My URLs Page

!["Screenshot of URLs page"](https://github.com/Karamvir-Bains/tinyapp/blob/main/docs/urls-page.png)

### Public URLs Page

!["Screenshot of URLs Public page"](https://github.com/Karamvir-Bains/tinyapp/blob/main/docs/urls-public-page.png)

### Public View Page

!["Screenshot of URLs Public View page"](https://github.com/Karamvir-Bains/tinyapp/blob/main/docs/urls-view-page.png)

### Edit View Page

!["Screenshot of URLs Edit View page"](https://github.com/Karamvir-Bains/tinyapp/blob/main/docs/urls-edit-page.png)

## Dependencies

- Node.js
- Express
- EJS
- bcryptjs
- cookie-session

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.

## Documentation
### ./
- `express_server.js`: It's the server file and it handles all routes.
- `helpers.js`: Is a set of helper functions.

### ./views
- `urls_error.ejs`: Displays an HTML error message.
- `urls_index.ejs`: Displays all user owned tiny urls.
- `urls_login.ejs`: Displays login page.
- `urls_new.ejs`: Displays create new tiny url page.
- `urls_public.ejs`: Displays all public urls.
- `urls_register.ejs`: Displays register page.
- `urls_show.ejs`: Displays a view page for a tiny url. Also it displays a edit feature if the owner is viewing the page.

### ./views/partials
- `_header.ejs`: The header bar at the top of each page.

### ./test
- `helpersTest.js`: Mocha and Chai automated testing for helper functions.

### ./docs
- Images for the README.md file.