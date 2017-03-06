# Internet Happiness Dashboard

![Heroku](https://heroku-badge.herokuapp.com/?app=afternoon-woodland-51981) [Live Demo](http://afternoon-woodland-51981.herokuapp.com/)

Happiness Dashboard for the Internet.

### How it works ?
_Background job_
1. Runs every minute using `node-schedule` to periodically query twitter (using `twitter` js client) for images related to being "happy".
2. For all the images that it gets from step 1, it queries Clarifai (using `clarifai` js client) to understand the concepts that the "happy" images contains.
3. Finally, it updates each concept's counter inside the DB.

_Dashboard_
* Displays the counter of top 25 things that Internet is happy about.

### Highlights
* Back-end: node.js, express, Clarifai JS client, twitter JS client, node-schedule.
* Doesn't store credentials in the code-base. The application loads these using the environment variables. See more heroku specific details [here](https://devcenter.heroku.com/articles/config-vars).
