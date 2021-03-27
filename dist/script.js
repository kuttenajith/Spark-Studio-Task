const Container = () => {
  const [searchTerms, setSearchTerms] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [noResults, setNoResults] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSearchForImages = React.useCallback(currentSearchTerms => {
    setSearchResults([]);
    if (currentSearchTerms) {
      setLoading(true);
      api.searchForImages({ searchTerms: currentSearchTerms }).
        then(data => {
          setLoading(false);
          setSearchResults(data.items);
          setNoResults(data.items.length === 0);
        });
    }
  }, [setSearchResults]);

  const debounceSearchForImages = React.useCallback(
    _.debounce(handleSearchForImages, 300),
    []);


  React.useEffect(() => {
    debounceSearchForImages(searchTerms);
  }, [searchTerms]);

  const refreshSearch = React.useCallback(currentSearchTerms => {
    console.log(currentSearchTerms);
    debounceSearchForImages(currentSearchTerms);
  },
    []);


  return (
    React.createElement("section", { className: "section" },
      React.createElement("div", { className: "container has-text-centered mainContainer" },
        React.createElement("p", { className: "title" },
          React.createElement("figure", { className: "image" },
          )),


        React.createElement("p", { className: "subtitle" },

          React.createElement("br", null)),


        React.createElement(SearchForm, { searchTerms: searchTerms, setSearchTerms: setSearchTerms, onSearchClicked: refreshSearch }),
        React.createElement(Gallery, { searchResults: searchResults, searchTerms: searchTerms, loading: loading, noResults: noResults }))));



};

const Gallery = ({ searchResults, searchTerms, loading, noResults }) => {
  if (loading) {
    return (
      React.createElement("progress", { className: "progress is-small is-info loadingBar", max: "10" }));

  }
  if (noResults) {
    return (
      React.createElement("p", null, "No images match your query"));



  }
  return (
    React.createElement("div", { class: "columns is-mobile is-multiline is-centered" },
      searchResults.map(result => {
        return (
          React.createElement("div", { className: "column is-narrow" },
            React.createElement(ImageItem, { imageItem: result, searchTerms: searchTerms })));


      })));


};

const ImageItem = ({ imageItem, searchTerms }) => {
  const cleanedAuthor = React.useCallback(author => {
    const quoteMarkIndex = author.indexOf('"');
    if (quoteMarkIndex === -1) return author;
    return author.substring(quoteMarkIndex + 1, author.length - 2);
  }, []);

  const {
    title,
    link,
    tags,
    author,
    media: {
      m: imgSrc } } =

    imageItem;
  return (
    React.createElement("div", { className: "card imageItem", key: link },
      React.createElement("div", { className: "card-image" },
        React.createElement("figure", null,
          React.createElement("img", { src: imgSrc, alt: title }))),
      React.createElement("div", { className: "card-content" },
        React.createElement("div", { className: "media" },
          React.createElement("div", { className: "media-content" },
            React.createElement("p", { className: "title is-4" }, title),
            React.createElement("p", { className: "subtitle is-6" }, "by: ", cleanedAuthor(author)))),
        React.createElement("br", null))));
};

const SearchForm = ({ searchTerms, setSearchTerms, onSearchClicked }) => {

  const handleChangeSearchTerms = React.useCallback(el => {
    setSearchTerms(el.target.value);
  }, [setSearchTerms]);

  const handleClickSearch = React.useCallback(currentSearchTerms => () => {
    onSearchClicked(currentSearchTerms);
  }, []);

  return (
    React.createElement("div", { className: "level" },
      React.createElement("div", { className: "level-item has-text-centered" },
        React.createElement("div", { className: "field has-addons" },
          React.createElement("div", { className: "control is-expanded" },
            React.createElement("input", { className: "input", type: "search", placeholder: "Search for images", value: searchTerms, onChange: handleChangeSearchTerms })),

          React.createElement("div", { className: "control" },
            React.createElement("a", { className: "button is-info", onClick: handleClickSearch(searchTerms) }, "Search"))))));
};

const utils = {
  tagsAsArray: searchTerms => searchTerms.toLowerCase().split(' ')
};


const api = {
  searchForImages: ({ searchTerms }) => {
    return fetch(createNasaQueryURL({ searchTerms })).
      then(response => response.text()).
      then(responseText => {
        // A JSONP response, remove the outer chars: "?(json);"
        const rawJSON = responseText.replace(/\n/g, ' ').match(/\?\((.*)\);/);
        if (!rawJSON) {
          throw new Error("error receiving data from NASA - incorrect format");
        }
        // select inner JSON
        const json = JSON.parse(rawJSON[1]);
        const data = cleanNasaResponse(json);
        return data;
      });
  }
};


// Removes characters from response and parse to get the useful data
const cleanNasaResponse = json => {
  const PATTERN = 'jsonFlickrFeed(';
  const dataString = json.data;
  const data = JSON.parse(dataString.substring(PATTERN.length, dataString.length - 1));
  return data;
};

const JSONP_PROXY_URL = 'https://jsonp.afeld.me/';
const NASA_API_BASE_URL = 'https://api.flickr.com/services/feeds/photos_public.gne';
// https://api.nasa.gov/planetary/apod?api_key=Pqrq4oVjoPmNR3EvygQkfLfy2pObe4Ad71pCHMdS
const NASA_API_FORMAT = 'json';

const createNasaQueryURL = ({ searchTerms }) => {
  const params = {
    format: NASA_API_FORMAT,
    tags: utils.tagsAsArray(searchTerms),
    lang: "en-us"
  };

  const query = new URLSearchParams(params);

  const proxyParams = {
    url: `${NASA_API_BASE_URL}?${query.toString()}`
  };

  const proxyQuery = new URLSearchParams(proxyParams);

  return `${JSONP_PROXY_URL}?callback=?&${proxyQuery.toString()}`;
};

ReactDOM.render(React.createElement(Container, null), document.getElementById('root'));