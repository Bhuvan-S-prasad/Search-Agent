export const AIModelsOptions = [
    {
        id:1,
        name: "GPT-5",
        description: "The latest and most advanced model from OpenAI.",
        ModelApi: ""

    },
    {
        id:2,
        name: "DeepSeek",
        description: "An advanced model optimized for deep search tasks.",
        ModelApi: ""

    },
    {
        id:3,
        name: "Grok 4",
        description: "AI model by xAI designed for versatile applications.",
        ModelApi: ""

    },
    {
        id:4,
        name: "Gemini 2.5 Flash",
        description: "Google's cutting-edge language model with enhanced capabilities.",
        ModelApi: ""

    },

]


export const SEARCH_RESULT = {
  kind: "customsearch#search",
  url: {
    type: "application/json",
    template:
      "https://www.googleapis.com/customsearch/v1?q={searchTerms}&num={count?}&start={startIndex?}&lr={language?}&safe={safe?}&cx={cx?}&sort={sort?}&filter={filter?}&gl={gl?}&cr={cr?}&googlehost={googleHost?}&c2coff={disableCnTwTranslation?}&hq={hq?}&hl={hl?}&siteSearch={siteSearch?}&siteSearchFilter={siteSearchFilter?}&exactTerms={exactTerms?}&excludeTerms={excludeTerms?}&linkSite={linkSite?}&orTerms={orTerms?}&dateRestrict={dateRestrict?}&lowRange={lowRange?}&highRange={highRange?}&searchType={searchType}&fileType={fileType?}&rights={rights?}&imgSize={imgSize?}&imgType={imgType?}&imgColorType={imgColorType?}&imgDominantColor={imgDominantColor?}&alt=json"
  },
  queries: {
    request: [
      {
        title: "Google Custom Search - one piece",
        totalResults: "3200000000",
        searchTerms: "one piece",
        count: 10,
        startIndex: 1,
        inputEncoding: "utf8",
        outputEncoding: "utf8",
        safe: "off",
        cx: "f33be7d7cfea74bda"
      }
    ],
    nextPage: [
      {
        title: "Google Custom Search - one piece",
        totalResults: "3200000000",
        searchTerms: "one piece",
        count: 10,
        startIndex: 11,
        inputEncoding: "utf8",
        outputEncoding: "utf8",
        safe: "off",
        cx: "f33be7d7cfea74bda"
      }
    ]
  },
  context: {
    title: "NOMI"
  },
  searchInformation: {
    searchTime: 0.479528,
    formattedSearchTime: "0.48",
    totalResults: "3200000000",
    formattedTotalResults: "3,200,000,000"
  },
  items: [
    {
      kind: "customsearch#result",
      title: "One Piece - Wikipedia",
      link: "https://en.wikipedia.org/wiki/One_Piece",
      displayLink: "en.wikipedia.org",
      snippet:
        "One Piece (stylized in all caps) is a Japanese manga series written and illustrated by Eiichiro Oda. It follows the adventures of Monkey D. Luffy and his crew...",
      formattedUrl: "https://en.wikipedia.org/wiki/One_Piece"
    },
    {
      kind: "customsearch#result",
      title: "Watch ONE PIECE | Netflix Official Site",
      link: "https://www.netflix.com/title/80217863",
      displayLink: "www.netflix.com",
      snippet:
        "With his straw hat and ragtag crew, young pirate Monkey D. Luffy goes on an epic voyage for treasure in this live-action adaptation of the popular manga."
    },
    {
      kind: "customsearch#result",
      title: "Read One Piece Manga Free - Official Shonen Jump From Japan - VIZ",
      link: "https://www.viz.com/shonenjump/chapters/one-piece",
      displayLink: "www.viz.com",
      snippet:
        "Join Monkey D. Luffy and his swashbuckling crew in their search for the ultimate treasure, the One Piece."
    },
    {
      kind: "customsearch#result",
      title: "One Piece (TV Series 1999– ) - IMDb",
      link: "https://www.imdb.com/title/tt0388629/",
      displayLink: "www.imdb.com",
      snippet:
        "Rubber-bodied dreamer Monkey D. Luffy gathers an eclectic pirate crew and braves the perilous Grand Line, battling tyrants and monsters to claim the legendary..."
    },
    {
      kind: "customsearch#result",
      title: "One Piece (ワンピース) (@onepiecenetflix) · Los Angeles, CA",
      link: "https://www.instagram.com/onepiecenetflix/?hl=en",
      displayLink: "www.instagram.com",
      snippet:
        "The cast and crew of ONE PIECE: INTO THE GRAND LINE pull back the curtain to show the heart, grit, and excitement that await beyond the horizon!"
    },
    {
      kind: "customsearch#result",
      title: "One Piece Wiki",
      link: "https://onepiece.fandom.com/wiki/One_Piece_Wiki",
      displayLink: "onepiece.fandom.com",
      snippet:
        "One Piece Wiki is the encyclopedia for the anime and manga of One Piece. Contribute to the wiki today and help build the most informative site."
    },
    {
      kind: "customsearch#result",
      title: "Watch One Piece - Crunchyroll",
      link: "https://www.crunchyroll.com/series/GRMG8ZQZR/one-piece",
      displayLink: "www.crunchyroll.com",
      snippet:
        "One Piece boasts more than 1100 episodes. Currently in the Egghead Arc, the Straw Hats finally meet the long awaited Dr. Vegapunk on Egghead Island."
    },
    {
      kind: "customsearch#result",
      title: "One Piece",
      link: "https://www.reddit.com/r/OnePiece/",
      displayLink: "www.reddit.com",
      snippet:
        "Welcome to r/OnePiece, the community for Eiichiro Oda's manga and anime series One Piece. From the East Blue to the New World, anything related to the series..."
    },
    {
      kind: "customsearch#result",
      title: "One Piece | One Piece Wiki | Fandom",
      link: "https://onepiece.fandom.com/wiki/One_Piece",
      displayLink: "onepiece.fandom.com",
      snippet:
        "The One Piece is the driving goal of Monkey D. Luffy and his crew, as well as many other pirates, all seeking to claim the treasure to become the next Pirate King."
    },
    {
      kind: "customsearch#result",
      title: "ONE PIECE CARD GAME - Official Web Site",
      link: "https://en.onepiece-cardgame.com/",
      displayLink: "en.onepiece-cardgame.com",
      snippet:
        "The official ONE PIECE Card Game website. Find out about the latest cards, products, events, rules, FAQ and more!"
    }
  ]
};
