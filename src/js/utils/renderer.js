
export function render(repository, commits) {
  const $commits = commits.map(commit => {
    return `
      <li>
        <span>${commit.message.replace(/\n/g, '<br />')}<span>
        <br /><br />
        <small>${commit.committer.name}</small>
      </li>`;
  });

  return `
    <h1>${repository.description}</h1>
    <h2>
      <a href="${repository.html_url}">${repository.full_name}</a>
    </h2>
    <ul>${$commits.join('')}</ul>
  `;
}

