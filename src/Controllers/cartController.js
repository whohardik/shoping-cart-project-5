const mongoose = require('mongoose')
const cartModel = require('../model/cartModel')
const productModel = require('../model/productModel')
const userModel = require('../model/userModel')


const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0;
};
const keyValid = (key) => {
    if (typeof key === 'undefined' || key === 'null') return false
    if (typeof key === 'string' && key.trim().length == 0) return false
    return true
}

let isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}


const addToCart = async function (req, res) {
    try {
        const userId = req.params.userId;
        const data = req.body;

        // validation starts
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please provide valid requestBody" })
        }

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "please provide valid userId" })

        }

        const findUser = await userModel.findById({ _id: userId })
        if (!findUser) return res.status(404).send({ status: false, message: "User doesn't exist" })

        // Authorization
        // if (userId != req.decodedtoken.userId)
        //     return res.status(403).send({ status: false, msg: 'User unauthorized!' })


        let { cartId, productId, quantity } = data

        let findCart = await cartModel.findOne({ userId: userId })


        if (cartId) {
            if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: " enter a valid cartId " });
            let checkCart = await cartModel.findById({ _id: cartId })
            if (!checkCart) return res.status(404).send({ status: false, message: " cart not found" })


            if (!findCart) { return res.status(403).send({ status: false, message: "Unauthorized access!! this user has no cart, trying to access someone else's cart" }) }
            if (userId != checkCart.userId) return res.status(403).send({ status: false, message: "Unauthorized access!! trying to access someone else's cart" })

        }

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Please provide valid ProductId" })
        }
        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProduct) {
            return res.status(404).send({ status: false, message: "Product doesn't exist " })
        }

        // if (!keyValid(quantity)) {
        //     quantity = 1
        // }

        //if (typeof quantity != "number" || quantity <= 0) { return res.status(400).send({ status: false, message: "Please provide valid quantity" }) }

        //All validations done, proceed to cart document



        //const findCartOfUser = await cartModel.findOne({ userId: userId })
        let priceSum = findProduct.price  //* quantity
        let item = { productId: productId, quantity: 1 }

        //let  totalItems = 1

        if (findCart) {
            // findCart.items.map(x=> x.productId.toString())
            // if(findCart.items.includes(productId))
            
            for (i in findCart.items) {
                if (findCart.items[i].productId.toString() == productId) {
                    //approach 1
                    //let userCart =  await cartModel.findByIdAndUpdate({ _id: userId },  { $push: {items: item}} , { $inc: { priceSum: priceSum , totalItems: 1 , 'items.$.quantity' : 1} }, { new: true })

                    //approach 2
                    findCart.items[i].quantity += 1;
                    findCart.totalPrice += priceSum;
                    findCart.totalItems += 1;
                    
                    findCart.save();
                    return res.status(200).send({ status: true, message: "Success", data: findCart }) 
                    
                    
                }
            }
            
           
            let userCart =  await cartModel.findByIdAndUpdate({ _id: userId },  { $push: {items: item}} , { $inc: { totalPrice: priceSum , totalItems: 1 } }, { new: true })
            return res.status(200).send({ status: true, message: "Success", data: userCart })
        }


        if (!findCart) {
            let data1 = {
                userId: userId,
                items: itemArr,
                totalPrice: priceSum,
                totalItems: 1
            }

            const newUserCart = await cartModel.create(data1)
            return res.status(201).send({ status: true, message: "Success", data: newUserCart })
        }
       

    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}

const updateCart = async function (req, res) {
    try {
        let data = req.body
        let userId = req.params.userId

        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "request Body cant be empty" });
        }
        let { cartId, productId, removeProduct } = data

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: "userId is not valid" })
        const checkUser = await userModel.findById(userId)
        if (!checkUser) return res.status(404).send({ status: false, msg: "user is not found" })

        if (userId != req.decodedtoken.userId)
            return res.status(403).send({ status: false, msg: 'User unauthorized!! loggedin is not allowed to modify the requested user data' })

        if (!cartId) return res.status(400).send({ status: false, msg: "plz provide cartId" })
        if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: " enter a valid cartId " });

        let findCart = await cartModel.findById({ _id: cartId })
        if (!findCart) return res.status(404).send({ status: false, message: " cart not found" })

        if (userId != findCart.userId) return res.status(403).send({ status: false, message: "Unauthorized access!! trying to access someone else's cart" })

        if (!productId) return res.status(400).send({ status: false, msg: "plz provide productId" })
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: " enter a valid productId " });

        let findProduct = await productModel.findById({ _id: productId })
        if (!findProduct) return res.status(404).send({ status: false, message: " product not found" })

        if (findProduct.isDeleted === true) return res.status(404).send({ status: false, message: " product already deleted" })

        if (removeProduct) {
            if (quantity < 1) {
                return res.status(404).send({ status: false, message: " no product in cart" })
            } else {
                await cartModel.findOneAndUpdate({ _id: cartId, _id: productId }, { $inc: { quantity: -1 } });
            }
        }




        let updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { $set: { data } }, { new: true })
        res.status(200).send({ status: true, msg: "successfully updated", data: updateCart })

    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}

const getCartById = async function (req, res) {
    try {
        let userId = req.params.userId
        userId = userId.trim()
        
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: " provide a valid userId " });

        let findUser = await userModel.findById({ _id: userId })
        if (!findUser) return res.status(404).send({ status: false, message: " user not found" })

        //<=========Authorization===========>

        // //check if the logged-in user is requesting to modify their own profile 
        // if (userId != req.decodedtoken.userId)
        //     return res.status(403).send({ status: false, msg: 'User unauthorized!! loggedin is not allowed to modify the requested user data' })


        let findCart = await cartModel.findOne({ userId: userId })
        if (!findCart) return res.status(404).send({ status: false, message: " cart doesn't exist for this user!!" })

        return res.status(200).send({ status: true, message: "Details fetched successfully", data: findCart })

    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }

}

const deleteCart = async function (req, res){
    try{
        let userId = req.params.userId
        userId = userId.trim()
       
        
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: " enter a valid userId " });

        let findUser = await userModel.findById({ _id: userId })
        if (!findUser) return res.status(404).send({ status: false, message: " userId not exists" })

       //Authorization
        // if(userId !=req.decodedtoken.userId)
        // return res.status(403).send({status : false,message:'user unauthorized ! user information not found'})

        let findCart = await cartModel.findOne({ userId: userId })
        if (!findCart) return res.status(404).send({ status: false, message: " cart doesn't exist for this user!!" })
        
        if(findCart.totalPrice == 0){return res.status(404).send({ status: false, message: " cart already deleted!!" })}

        let deleteObject = {items: [], totalPrice: 0,totalItems :0 }
        
        let deletedCart = await cartModel.findOneAndUpdate({ _id: userId }, deleteObject, { new: true })
        res.status(200).send({ status: true, message: "deleted", data: deletedCart })


    }catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}


module.exports = { addToCart, updateCart, getCartById, deleteCart }