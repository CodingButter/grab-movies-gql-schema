const { jsonDefs } = require("../Schemas");

const mediaResolver = {};
Object.keys(jsonDefs.type.Media).forEach((key) => {
  mediaResolver[key] = async (root, params, { dataSources }) => {
    if (root[key]) return root[key];
    const media = await dataSources.TmdbAPI.getMediaById(
      root.id,
      root.media_type
    );
    return media[key];
  };
});

const tediumResolvers = {
  backdrop: async (
    { id, media_type, backdrop_path },
    params,
    { dataSources }
  ) => {
    if (!backdrop_path) {
      const media = dataSources.TmdbAPI.getMediaById(id, media_type);
      return await dataSources.TmdbAPI.getImageSizes(
        media.backdrop_path,
        "backdrop"
      );
    }
    return await dataSources.TmdbAPI.getImageSizes(backdrop_path, "backdrop");
  },
  imdb_id: async (
    { id, media_type, imdb_id, name, year },
    params,
    { dataSources }
  ) => {
    var media;
    if (imdb_id) return imdb_id;
    media = await dataSources.TmdbAPI.getMediaById(id, media_type);
    if (!media.imdb) {
      const { imdbID } = await dataSources.OmdbAPI.getMovieByTitleYear(
        name,
        year
      );
      return imdbID;
    }
    return media.imdb_id;
  },

  poster: async ({ poster_path }, params, { dataSources }) => {
    return await dataSources.TmdbAPI.getImageSizes(poster_path, "poster");
  },
  seasons: async ({ seasons }, params, { dataSoruces }) => {},
  torrents: async (root, params, { dataSources }) => {
    var definition = {
      media_type: root.media_type,
      imdb_id: root.imdb_id,
      title: root.title,
      year: root.year,
    };
    if (root.imdb_id && root.title && root.year)
      return await dataSources.TorrentSearch.getTorrents(definition);
    if (!root.imdb_id) {
      const media = await dataSources.TmdbAPI.getMediaById(
        root.id,
        root.media_type
      );
      definition.imdb_id = media.imdb_id;
      if (!media.imdb_id) {
        const omdb = await dataSources.OmdbAPI.getMovieByTitleYear(
          root.title,
          root.year
        );
        definition.imdb_id = omdb.imdbID;
      }
    }
    if (!definition.imdb_id || !definition.title || !definition.year) return [];
    //console.log({ definition });
    return await dataSources.TorrentSearch.getTorrents(definition);
  },
};

module.exports = {
  MediaList: {
    page: async ({ page }) => {
      return page;
    },
    results: async ({ results }) => {
      return results;
    },
    total_results: async ({ total_results }) => {
      return total_results;
    },
    total_pages: async ({ total_pages }) => {
      return total_pages;
    },
  },

  Media: Object.assign(mediaResolver, tediumResolvers),
};
