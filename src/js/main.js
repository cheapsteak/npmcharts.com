'use strict';

import {partialRight, invoke} from 'lodash';

Promise.all([
  fetch('https://api.github.com/repos/leonidas/gulp-project-template'),
  fetch('https://api.github.com/repos/leonidas/gulp-project-template/commits')
])
.then(partialRight(invoke, 'json'))
.then(Promise.all.bind(Promise))
.then(data => {

  const [repository, commits] = data;
  const {html_url, description, full_name} = repository;

  const commitItems = commits.map(item => {
    const {commit} = item;

    return `
      <li>
        <span>${commit.message.replace(/\n/g, '<br />')}<span>
        <br /><br />
        <small>${commit.committer.name}</small>
      </li>`;
  });

  document.body.innerHTML = `
    <h1>${description}</h1>
    <h2><a href="${html_url}">${full_name}</a></h2>
    <ul>${commitItems.join('')}</ul>
  `;
});

