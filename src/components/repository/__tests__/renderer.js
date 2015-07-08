/* globals beforeEach, describe, it */
import {render} from '../';
import {expect} from 'chai';

const REPO_DATA = {
  html_url: 'http://example.com',
  full_name: 'Gulp project template',
  description: 'Hello world!'
};

const COMMITS = [{
  message: 'initial commit',
  committer: {
    name: 'Riku'
  }
}, {
  message: 'final commit',
  committer: {
    name: 'L.H.Ahne'
  }
}];

describe('View renderer', function() {
  beforeEach(function() {
    document.body.innerHTML = render(REPO_DATA, COMMITS);
  });

  it('should render a title with the string "Hello world!"', function() {
    const $title = document.getElementsByTagName('h1')[0];
    expect($title.innerHTML).to.equal('Hello world!');
  });

  it('should render 2 list items', function() {
    const $listItems = document.querySelectorAll('li');
    expect($listItems.length).to.equal(2);
  });
});
