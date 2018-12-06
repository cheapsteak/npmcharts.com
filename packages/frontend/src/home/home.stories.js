import { storiesOf } from '@storybook/vue';
import StoryRouter from 'storybook-vue-router';

import { routes } from '../router';

const storybookHomepage = (storyName, initialEntry) =>
  storiesOf('home', module)
    .addDecorator(
      StoryRouter(
        {},
        {
          routes,
          initialEntry,
        },
      ),
    )
    .add(storyName, () => ({
      template: `<router-view/>`,
    }));

storybookHomepage(
  'log4js, winston | weekly',
  '/compare/log4js,winston?interval=7',
);

storybookHomepage(
  'log4js, winston | daily',
  '/compare/log4js,winston?interval=1',
);

storybookHomepage(
  'log4js, winston | monthly',
  '/compare/log4js,winston?interval=30',
);

storybookHomepage(
  'log4js, winston | weekly (minimal mode)',
  '/compare/log4js,winston?interval=7&minimal=true',
);

storybookHomepage(
  'log4js, winston | daily (minimal mode)',
  '/compare/log4js,winston?interval=1&minimal=true',
);

storybookHomepage(
  'log4js, winston | monthly (minimal mode)',
  '/compare/log4js,winston?interval=30&minimal=true',
);
