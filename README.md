# Internet Happiness Dashboard

![Heroku](https://heroku-badge.herokuapp.com/?app=afternoon-woodland-51981) [Live Demo](http://afternoon-woodland-51981.herokuapp.com/)

Happiness Dashboard for the Internet.

### Highlights
* Uses twitter to query for images that are related to being "happy".
* Uses Clarifai to understand the concepts that the "happy" images contains.
* Back-end: node.js, express, Clarifai JS client, twitter JS, client, node-schedule
* Doesn't store credentials separately in the code-base. The application loads these using the environment variables. See more heroku specific details [here](https://devcenter.heroku.com/articles/config-vars).
