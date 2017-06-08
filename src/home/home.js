import _ from 'lodash';
import npmData from '../services/downloads.js';
import {graph} from '../graph/graph.js';
import config from '../../config.js';

const palette = config.palette;

var {default: packageInput, emitter: packageEvents, packages, removePackage} = require('../packages/packages.js');

const injectDisqus = () => {
  var d = document, s = d.createElement('script');
  s.src = '//npmcharts.disqus.com/embed.js';
  s.setAttribute('data-timestamp', +new Date());
  (d.head || d.body).appendChild(s);

  var d = document, s = d.createElement('script');
  s.src = '//npmcharts.disqus.com/count.js';
  s.setAttribute('data-timestamp', +new Date());
  s.setAttribute('id', 'dsq-count-scr');
  (d.head || d.body).appendChild(s);
};

const resetDisqus = (packages) => {
  if (!packages) { return }
  const sortedPackages = packages.slice().sort();
  if (window.DISQUS && window.DISQUSWIDGETS) {
    window.DISQUS.reset({
      reload: true,
      config: function () {  
        this.page.identifier = sortedPackages.join(',')
        this.page.url = 'http://npmcharts.com/compare/' + sortedPackages.join(',');
      }
    })
    DISQUSWIDGETS.getCount({reset: true});
  } else {
    setTimeout(resetDisqus, 500)
  }
}

export default Vue.extend({
  route: {
    waitForData: true,
    data ({ to, next, redirect }) {
      const packageNames = (
        to.path === '/' || !to.params.packages
          ? _.sample(this.presetPackages)
          : to.params.packages.split(',').map(packageName => window.decodeURIComponent(packageName))
      );

      if (to.path === '/' || !to.params.packages) {
        document.title = "Compare download stats for npm packages - npmcharts";
        this.isUsingPresetPackages = true;
      } else {
        document.title = "Compare downloads for " + to.params.packages.split(',').join(', ') + " - npmcharts";
      }

      ga('send', 'pageview');

      packageNames
      ? npmData.fetch(packageNames, false)
          .then(() => {
            const moduleData = npmData.modules.map(x => ({
              ...x,
              // if most recent day has no download count, remove it
              downloads: _.last(x.downloads).count === 0 ? _.initial(x.downloads) : x.downloads,
            }))
            next({moduleNames: npmData.moduleNames, moduleData, isUsingPresetPackages: !to.params.packages});
          })
      : next({moduleNames: null, moduleData: null, samplePreset: _.sample(this.presetPackages)});
    },
  },
  template: require('./home.html'),
  data () {
    return {
      presetPackages: config.presetPackages,
      samplePreset: [],
      moduleNames: null,
      moduleData: null,
      palette,
      showWeekends: false,
      showOutliers: true,
      isUsingPresetPackages: undefined,
      hoverCount: 0,
      twitterIcon: require('../assets/images/icon-twitter.svg'),
      shouldShowComments: window.innerWidth >= 1000 && !(JSON.parse(window.localStorage.getItem('shouldShowComments')) === false),
    };
  },
  computed: {
    shareUrl () {
      return this.moduleNames && `http://npmcharts.com/compare/${this.moduleNames.join(',')}`;
    },
    twitterShareUrl () {
      return this.shareUrl && `https://twitter.com/intent/tweet?url=${window.encodeURIComponent(this.shareUrl)}`;
    },
    twitterMessage () {
      const hoverCount = this.hoverCount;
      return hoverCount < 3
        ? 'this chart'
        : hoverCount < 6
          ? 'neat eh?'
          : hoverCount < 10
            ? 'do iiiit'
            : 'just click it already!'
    },
    disqusIdentifier () {
      return (this.moduleNames || []).slice().sort().join(',');
    },
  },
  watch: {
    moduleNames (moduleNames, oldModuleNames) {
      resetDisqus(moduleNames);
    },
    shouldShowComments () {
      this.$refs.graph.render()
    },
  },
  ready () {
    injectDisqus()
    packageEvents.on('change', () => {
      this.$route.router.go('/compare/' + packages.join(','));
      console.log('change', resetDisqus)
      resetDisqus(packages);
    });
  },
  methods: {
    addPackage (packageName) {
      ga('send', 'event', 'packageInput', 'add', `${packageName} existing:${this.moduleNames}`);
      if (this.$route.params && this.$route.params.packages) {
        this.$route.router.go('/compare/' + this.$route.params.packages + ',' + packageName);
      } else {
        this.$route.router.go('/compare/' + packageName);
      }
    },
    clearPackages () {
      this.$route.router.go('/compare');
    },
    handleClickToggleComments () {
      const eventAction = this.shouldShowComments ? 'close' : 'open';
      const eventLabel = (this.moduleNames || []).slice().sort().join(',');
      ga('send', 'event', 'comment toggle', eventAction, eventLabel);
      this.shouldShowComments = !this.shouldShowComments;
      window.localStorage.setItem('shouldShowComments', this.shouldShowComments);
    },
    handleClickTwitter () {
      ga('send', 'event', 'share', 'twitter', this.twitterShareUrl);
      window.open(this.twitterShareUrl);
    },
    handleHoverTwitter () {
      this.hoverCount++;
      ga('send', 'event', 'hoverShare', 'twitter', this.twitterShareUrl, this.hoverCount);
      
    },
    handleMouseEnterTwitter () {
      this.twitterEventTimeout = setTimeout(this.handleHoverTwitter, 500)
    },
    handleMouseLeaveTwitter () {
      clearTimeout(this.twitterEventTimeout);
    },
    shuffle: _.shuffle,
  },
  components: {
    'package-input': packageInput,
    graph: require('../graph/graph.js')
  }
});