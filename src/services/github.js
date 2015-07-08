const REPO_URL = 'https://api.github.com/repos/leonidas/gulp-project-template';

export function getRepo() {
  return fetch(REPO_URL).then(res => res.json());
}

export function getCommits() {
  return fetch(`${REPO_URL}/commits`)
    .then(res => res.json())
    .then(commits => {
      return commits.map(({commit}) => commit);
    });
}
