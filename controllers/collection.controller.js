import Collection from "../models/collection.schema.js";
import Product from "../models/product.schema.js";
import asyncHandler from "../services/asyncHandler.js";
import CustomError from "../utils/customError.js";

/***************************************************************
 * @CREATE_COLLECTION
 * @REQUEST_TYPE POST
 * @route http://localhost:4000/api/collection/create
 * @description admin can create collection
 * @returns success - collection
 ***************************************************************/

export const createCollection = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    throw new CustomError("Please fill the name field", 401);
  }
  const user = req.user;

  if (user.role === "ADMIN") {
    const collection = await Collection.create({
      name,
    });
    return res.status(200).json({
      success: true,
      message: "Collection created successfully",
      collection,
    });
  }

  throw new CustomError("Only admin can create collection", 401);
});

/***************************************************************
 * @GET_COLLECTIONS
 * @REQUEST_TYPE GET
 * @route http://localhost:4000/api/collections
 * @description fetch all the collections
 * @returns success - collections available in DB
 ***************************************************************/

export const getCollections = asyncHandler(async (req, res) => {
  const { page, limit = 10 } = req.query

  if(!page) {
    const collections = await Collection.find({});
    if (collections.length) {
      return res.status(200).json({
        success: true,
        message: "An array of all collections",
        collections,
      });
    } else {
      throw new CustomError("No collection available in DB", 401);
    }
  }

  const skipCount = (page - 1) * limit;

  const collections = await Collection.find().sort({id: -1}).skip(skipCount).limit(limit)

  if(collections.length === 0) {
    throw new CustomError("No collection found", 404)
  }

  const totalItem = await Collection.countDocuments()

  return res.status(200).json({
    success: true,
    message: "An array of collections",
    collections,
    currentPage: +page,
    totalPage: Math.ceil(totalItem / limit)
  });
});

/***************************************************************
 * @UPDATE_COLLECTION
 * @REQUEST_TYPE PUT
 * @route http://localhost:4000/api/collection/:collectionId
 * @description admin can edit the collection
 * @returns success - updated collection
 ***************************************************************/

export const updateCollection = asyncHandler(async (req, res) => {
  const user = req.user;

  const { name } = req.body;
  if (!name) {
    throw new CustomError("Name field is required", 401);
  }
  const { id } = req.params;
  if (id) {
    const collection = await Collection.findById(id);

    if (collection) {
      collection.name = name;
      await collection.save();
      return res.status(200).json({
        success: true,
        message: "Collection updated successfully",
        collection,
      });
    }
    throw new CustomError(`No collection found by the id ${editId}`);
  }

  throw new CustomError("Enter the collection Id", 401);
});

/***************************************************************
 * @DELETE_COLLECTION
 * @REQUEST_TYPE DELETE
 * @route http://localhost:4000/api/collection/:collectionId
 * @description admin can delete the collection
 * @returns success - deleted collection
 ***************************************************************/

export const deleteCollection = asyncHandler(async (req, res) => {
  const user = req.user;

  const { id } = req.params;
  if (id) {
    await Collection.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Collection deleted successfully",
    });
  }
  throw new CustomError("Provide the collection id", 401);
});

/***************************************************************
 * @GET_COLLECTION
 * @REQUEST_TYPE GET
 * @route http://localhost:4000/api/collection/:collectionId
 * @description get the collection
 * @returns success - collection
 ***************************************************************/

export const getCollection = asyncHandler(async (req, res) => {
  const collectionId = req.params;
  if (!collectionId) {
    throw new CustomError("Provide the collection Id", 401);
  }
  const collection = await Collection.findById(collectionId);
  if (!collection) {
    throw new CustomError("Collection not found in DB", 401);
  }
  return res.status(200).json({
    success: true,
    message: "Collection found in DB",
    collection,
  });
});

/**********************************************************
 * @GET_PRODUCTS_BY_COLLECTIONID
 * @route https://localhost:5000/api/product/:productId
 * @description Controller used for getting single product details
 * @description User and admin can get single product details
 * @returns Product Object
 *********************************************************/

export const getProductByCollectionId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 9;
  const pricing = req.query.pricing;
  const skipCount = (page - 1) * limit;

  let sortingOption = {};
  if (pricing) {
    sortingOption.sellingPrice = pricing;
  }

  // Use a single sorting object that includes both criteria
  const combinedSorting = {
      ...sortingOption,
      _id: -1, // Sorting by _id: -1 for recently added products
  };


  const products = await Product.find({ collectionId: id})
    .sort(combinedSorting) // Apply the combined sorting criteria
    .skip(skipCount)
    .limit(limit);

  if (!products.length) {
    throw new CustomError("No product found in DB", 400);
  }

  return res.status(200).json({
    success: true,
    products,
  });
});

