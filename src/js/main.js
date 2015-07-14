'use strict';

import {getCommits, getRepo} from './services/github';
import {render} from './utils/renderer';

Promise.all([getRepo(), getCommits()])
.then(([repository, commits]) => {
  document.body.innerHTML = render(repository, commits);
});

