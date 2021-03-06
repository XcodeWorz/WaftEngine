const httpStatus = require('http-status');
const otherHelper = require('../../helper/others.helper');
const blogConfig = require('./blogConfig');
const blogSch = require('./blogSchema');
const blogCatSch = require('./categorySchema');
const blogController = {};

blogController.GetBlogAuthorize = async (req, res, next) => {
  try {
    let { page, size, populate, selectQuery, searchQuery, sortQuery } = otherHelper.parseFilters(req, 10, false);
    populate = [
      {
        path: 'author',
        select: '_id name',
      },
      {
        path: 'category',
        select: '_id title',
      },
    ];
    selectQuery = 'title description summary tags author short_description meta_tag meta-description category keywords slug_url is_published published_on is_active image added_by added_at updated_at updated_by';
    if (req.query.find_title) {
      searchQuery = {
        title: {
          $regex: req.query.find_title,
          $options: 'i',
        },
        ...searchQuery,
      };
    }
    if (req.query.find_published_on) {
      searchQuery = {
        published_on: {
          $regex: req.query.find_published_on,
          $options: 'i',
        },
        ...searchQuery,
      };
    }
    let blogs = await otherHelper.getquerySendResponse(blogSch, page, size, sortQuery, searchQuery, selectQuery, next, populate);
    return otherHelper.paginationSendResponse(res, httpStatus.OK, true, blogs.data, blogConfig.get, page, size, blogs.totaldata);
  } catch (err) {
    next(err);
  }
};
blogController.getLatestBlog = async (req, res, next) => {
  try {
    const data = await blogSch
      .find({ is_active: true, is_deleted: false })
      .select({ slug_url: 1, title: 1, added_at: 1, image: 1 })
      .sort({ _id: -1 })
      .skip(0)
      .limit();
    return otherHelper.sendResponse(res, httpStatus.OK, true, data, null, 'Latest Blog get success!!', null);
  } catch (err) {
    next(err);
  }
};
blogController.getLatestBlogByCat = async (req, res, next) => {
  try {
    const size_default = 10;
    let size;
    if (req.query.size && !isNaN(req.query.size) && req.query.size != 0) {
      size = Math.abs(req.query.size);
    } else {
      size = size_default;
    }
    const cat_id = req.params.cat_id;
    const category = await blogCatSch.findById(cat_id).select({ title: 1 });
    const blogs = await blogSch
      .find({ is_active: true, is_deleted: false, category: cat_id })
      .select({
        short_description: 1,
        slug_url: 1,
        title: 1,
        added_at: 1,
        image: 1,
        category: 1,
        author: 1,
      })
      .populate([
        { path: 'category', select: 'title' },
        { path: 'author', select: 'name' },
      ])
      .sort({ _id: -1 })
      .skip(0)
      .limit(size * 1);
    const totaldata = blogs.length;
    return otherHelper.sendResponse(res, httpStatus.OK, true, { blogs, category, totaldata }, null, 'Latest blogs by category', null);
  } catch (err) {
    next(err);
  }
};
blogController.getRelatedBlog = async (req, res, next) => {
  try {
    const tages = await blogSch
      .findOne({
        is_active: true,
        is_deleted: false,
        slug_url: req.params.slug_url,
      })
      .select('tags meta_tag category keywords');
    // .lean();
    const d = [...tages.meta_tag, ...tages.keywords, ...tages.tags];

    const data = await blogSch
      .find({
        is_active: true,
        is_deleted: false,
        slug_url: { $ne: req.params.slug_url },
        tags: { $elemMatch: { $in: d } },
      })
      .select({ slug_url: 1, title: 1, added_at: 1, image: 1 })
      .sort({ _id: -1 })
      .skip(0)
      .limit(5);
    return otherHelper.sendResponse(res, httpStatus.OK, true, data, null, 'Latest Blog', null);
  } catch (err) {
    next(err);
  }
};

blogController.GetBlogArchives = async (req, res, next) => {
  try {
    const blogArchives = await blogSch
      .find({ is_deleted: false, is_active: true })
      .select({ added_at: 1, published_on: 1 })
      .sort({ added_at: -1 })
      .skip(0)
      .limit(10);
    const month = [];
    const months = blogArchives.map(each => {
      if (month.includes(each.added_at.getMonth())) {
        return null;
      } else {
        month.push(each.added_at.getMonth());
        return each.added_at;
      }
    });
    return otherHelper.sendResponse(res, httpStatus.OK, true, months, null, 'archives get success!!', null);
  } catch (err) {
    next(err);
  }
};

blogController.GetBlogNonAuthorize = async (req, res, next) => {
  try {
    let { page, size, populate, selectQuery, searchQuery, sortQuery } = otherHelper.parseFilters(req, 12, false);
    populate = [
      {
        path: 'category',
        select: '_id title',
      },
      {
        path: 'author',
        select: '_id name',
      },
    ];
    selectQuery = 'title description summary tags author short_description meta_tag meta-description category keywords slug_url published_on is_active image added_by added_at updated_at updated_by';

    searchQuery = {
      is_published: true,
      is_active: true,
      ...searchQuery,
    };
    if (req.query.find_title) {
      searchQuery = {
        title: {
          $regex: req.query.find_title,
          $options: 'i',
        },
        ...searchQuery,
      };
    }
    if (req.query.find_published_on) {
      searchQuery = {
        published_on: {
          $regex: req.query.find_published_on,
          $options: 'i',
        },
        ...searchQuery,
      };
    }
    let blogs = await otherHelper.getquerySendResponse(blogSch, page, size, sortQuery, searchQuery, selectQuery, next, populate);
    return otherHelper.paginationSendResponse(res, httpStatus.OK, true, blogs.data, blogConfig.get, page, size, blogs.totaldata);
  } catch (err) {
    next(err);
  }
};
blogController.GetBlogCategory = async (req, res, next) => {
  try {
    let { page, size, populate, selectQuery, searchQuery, sortQuery } = otherHelper.parseFilters(req, 10, false);
    selectQuery = 'title slug_url description image is_active added_by added_at updated_at updated_by is_deleted';
    if (req.query.find_title) {
      searchQuery = {
        title: {
          $regex: req.query.find_title,
          $options: 'i',
        },
        ...searchQuery,
      };
    }
    if (req.query.is_active) {
      searchQuery = { is_active: true, ...searchQuery };
    }
    let blogcats = await otherHelper.getquerySendResponse(blogCatSch, page, size, sortQuery, searchQuery, selectQuery, next, '');
    return otherHelper.paginationSendResponse(res, httpStatus.OK, true, blogcats.data, blogConfig.cget, page, size, blogcats.totaldata);
  } catch (err) {
    next(err);
  }
};
blogController.GetBlogCatById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const blogcats = await blogCatSch.findOne({
      _id: id,
    });
    return otherHelper.sendResponse(res, httpStatus.OK, true, blogcats, null, blogConfig.cget, null);
  } catch (err) {
    next(err);
  }
};
blogController.SaveBlog = async (req, res, next) => {
  try {
    let blogs = req.body;
    if (req.file) {
      req.file.destination =
        req.file.destination
          .split('\\')
          .join('/')
          .split('server/')[1] + '/';
      req.file.path = req.file.path
        .split('\\')
        .join('/')
        .split('server/')[1];
    }
    if (blogs && blogs._id) {
      if (req.file) {
        blogs.image = req.file;
      }
      if (!blogs.meta_tag) blogs.meta_tag = [];
      if (!blogs.category) blogs.category = [];
      if (!blogs.tags) blogs.tags = [];
      if (!blogs.keywords) blogs.keywords = [];
      const update = await blogSch.findByIdAndUpdate(
        blogs._id,
        {
          $set: blogs,
        },
        { new: true },
      );
      return otherHelper.sendResponse(res, httpStatus.OK, true, update, null, blogConfig.save, null);
    } else {
      blogs.image = req.file;
      const newBlog = new blogSch(blogs);
      const BlogSave = await newBlog.save();
      return otherHelper.sendResponse(res, httpStatus.OK, true, BlogSave, null, blogConfig.save, null);
    }
  } catch (err) {
    next(err);
  }
};
blogController.SaveBlogCategory = async (req, res, next) => {
  try {
    let blogcats = req.body;
    if (req.file) {
      req.file.destination =
        req.file.destination
          .split('\\')
          .join('/')
          .split('server/')[1] + '/';
      req.file.path = req.file.path
        .split('\\')
        .join('/')
        .split('server/')[1];
    }
    if (blogcats && blogcats._id) {
      blogcats.updated_at = new Date();
      blogcats.updated_by = req.user.id;
      if (req.file) {
        blogcats.image = req.file;
      }
      const update = await blogCatSch.findByIdAndUpdate(
        blogcats._id,
        {
          $set: blogcats,
        },
        { new: true },
      );
      return otherHelper.sendResponse(res, httpStatus.OK, true, update, null, blogConfig.csave, null);
    } else {
      blogcats.image = req.file;
      const newBlog = new blogCatSch(blogcats);
      const catSave = await newBlog.save();
      return otherHelper.sendResponse(res, httpStatus.OK, true, catSave, null, blogConfig.csave, null);
    }
  } catch (err) {
    next(err);
  }
};
blogController.GetBlogDetail = async (req, res, next) => {
  const id = req.params.id;
  const populate = [];
  const blog = await blogSch
    .findOne({
      _id: id,
      is_deleted: false,
    })
    .populate(populate);
  return otherHelper.sendResponse(res, httpStatus.OK, true, blog, null, blogConfig.get, null);
};
blogController.GetBlogBySlug = async (req, res, next) => {
  const slug = req.params.slug_url;
  const blogs = await blogSch
    .findOne(
      {
        slug_url: slug,
        is_deleted: false,
        is_published: true,
      },
      {
        is_published: 0,
      },
    )
    .populate([
      { path: 'author', select: '_id name avatar image' },
      { path: 'category', select: '_id title slug_url' },
    ]);
  return otherHelper.sendResponse(res, httpStatus.OK, true, blogs, null, blogConfig.get, null);
};

blogController.GetBlogById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const blogs = await blogSch.findOne({
      _id: id,
      is_deleted: false,
    });
    return otherHelper.sendResponse(res, httpStatus.OK, true, blogs, null, blogConfig.get, null);
  } catch (err) {
    next(err);
  }
};

blogController.GetBlogByCat = async (req, res, next) => {
  try {
    let { page, size, populate, selectQuery, searchQuery, sortQuery } = otherHelper.parseFilters(req, 10, false);
    const slug = req.params.slug_url;
    const cat = await blogCatSch.findOne({ slug_url: slug, is_deleted: false }, { _id: 1, title: 1 });
    populate = [
      {
        path: 'category',
        select: 'title slug_url',
      },
      {
        path: 'author',
        select: 'name',
      },
    ];
    selectQuery = 'title description summary tags author short_description meta_tag meta-description category keywords slug_url published_on is_active image added_by added_at updated_at updated_by';
    searchQuery = {
      is_published: true,
      is_active: true,
      category: cat._id,
      ...searchQuery,
    };
    if (req.query.find_title) {
      searchQuery = {
        title: {
          $regex: req.query.find_title,
          $options: 'i',
        },
        ...searchQuery,
      };
    }
    if (req.query.find_published_on) {
      searchQuery = {
        published_on: {
          $regex: req.query.find_published_on,
          $options: 'i',
        },
        ...searchQuery,
      };
    }
    let blogs = await otherHelper.getquerySendResponse(blogSch, page, size, sortQuery, searchQuery, selectQuery, next, populate);
    return otherHelper.paginationSendResponse(res, httpStatus.OK, true, blogs.data, cat.title, page, size, blogs.totaldata);
  } catch (err) {
    next(err);
  }
};
blogController.GetBlogByTag = async (req, res, next) => {
  try {
    let page;
    let size;
    let searchQuery;
    let populateq;
    const size_default = 10;
    if (req.query.page && !isNaN(req.query.page) && req.query.page != 0) {
      page = Math.abs(req.query.page);
    } else {
      page = 1;
    }
    if (req.query.size && !isNaN(req.query.size) && req.query.size != 0) {
      size = Math.abs(req.query.size);
    } else {
      size = size_default;
    }
    const tag = req.params.tag;
    populateq = [{ path: 'author', select: 'name' }];
    searchQuery = {
      is_deleted: false,
      tags: tag,
    };
    const tagBlog = await otherHelper.getquerySendResponse(blogSch, page, size, '', searchQuery, '', next, populateq);
    return otherHelper.paginationSendResponse(res, httpStatus.OK, true, tagBlog.data, blogConfig.get, page, size, tagBlog.totaldata);
  } catch (err) {
    next(err);
  }
};
blogController.GetBlogByAuthor = async (req, res, next) => {
  try {
    const size_default = 10;
    let page;
    let size;
    let searchQuery;
    let populateq;
    if (req.query.page && !isNaN(req.query.page) && req.query.page != 0) {
      page = Math.abs(req.query.page);
    } else {
      page = 1;
    }
    if (req.query.size && !isNaN(req.query.size) && req.query.size != 0) {
      size = Math.abs(req.query.size);
    } else {
      size = size_default;
    }
    const authorId = req.params.author;
    populateq = [{ path: 'author', select: 'name' }];
    searchQuery = { is_deleted: false, is_active: true, author: authorId };
    const blogByAuthor = await otherHelper.getquerySendResponse(blogSch, page, size, '', searchQuery, '', next, populateq);
    return otherHelper.paginationSendResponse(res, httpStatus.OK, true, blogByAuthor.data, 'blogs by author get success!!', page, size, blogByAuthor.totaldata);
  } catch (err) {
    next(err);
  }
};
blogController.GetBlogByDate = async (req, res, next) => {
  try {
    let page;
    let size;
    let searchQuery;
    let populateq;
    const size_default = 10;
    if (req.query.page && !isNaN(req.query.page) && req.query.page != 0) {
      page = Math.abs(req.query.page);
    } else {
      page = 1;
    }
    if (req.query.size && !isNaN(req.query.size) && req.query.size != 0) {
      size = Math.abs(req.query.size);
    } else {
      size = size_default;
    }
    let start = new Date(req.params.time);
    let end = new Date(req.params.time);
    end.setMonth(end.getMonth() + 1);

    searchQuery = {
      is_deleted: false,
      is_active: true,
      is_published: true,
    };
    if (start) {
      searchQuery = {
        added_at: {
          $gte: start,
          $lt: end,
        },
        ...searchQuery,
      };
    }
    populateq = [
      { path: 'category', select: 'title' },
      { path: 'author', select: 'name' },
    ];

    const tagBlog = await otherHelper.getquerySendResponse(blogSch, page, size, '', searchQuery, '', next, populateq);
    return otherHelper.paginationSendResponse(res, httpStatus.OK, true, tagBlog.data, blogConfig.get, page, size, tagBlog.totaldata);
  } catch (err) {
    next(err);
  }
};
blogController.DeleteBlog = async (req, res, next) => {
  const id = req.params.id;
  const blog = await blogSch.findByIdAndUpdate(id, {
    $set: {
      is_deleted: true,
      deleted_at: new Date(),
    },
  });
  return otherHelper.sendResponse(res, httpStatus.OK, true, blog, null, blogConfig.delete, null);
};
blogController.DeleteBlogCat = async (req, res, next) => {
  const id = req.params.id;
  const blogCat = await blogCatSch.findByIdAndUpdate(id, {
    $set: {
      is_deleted: true,
      deleted_at: new Date(),
    },
  });
  return otherHelper.sendResponse(res, httpStatus.OK, true, blogCat, null, blogConfig.deleteCat, null);
};

module.exports = blogController;
