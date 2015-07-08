
export function render(repository, commits) {
  const $commits = commits.map(commit => {
    return `
      <li class="commit">
        <span>
          ${commit.message.replace(/\n/g, '<br />')}
        <span>
        <br /><br />
        <small>
          ${commit.committer.name}
        </small>
      </li>`;
  });

  return `
    <div class="repository">
      <h1 class="repository__title">${repository.description}</h1>
      <h2 class="repository__description">
        <a href="${repository.html_url}">${repository.full_name}</a>
      </h2>
      <ul class="repository__commits">
        ${$commits.join('')}
      </ul>
    </div>
  `;
}

