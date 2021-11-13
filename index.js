// const express = require('express')
// const app = express()
// const cors = require('cors')
// require('dotenv').config()
// const { MongoClient } = require('mongodb');
// const port = process.env.PORT || 5000;

const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const admin = require("firebase-admin");
require('dotenv').config()
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;




const serviceAccount = ("assignment-12-firebase-adminsdk.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


app.use(cors());
app.use(express.json());

//

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s09u9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }

    }
    next();
}

async function run() {
    try {
        await client.connect();
        const database = client.db('shop');
        const productCollection = database.collection('products');
        const orderCollection = database.collection('orders');
        const usersCollection = database.collection('users');
        const reviewCollection = database.collection('reviews');

        //Get all product 
        app.get('/products', async (req, res) => {
            const cursor = productCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        })
        //Get single product data
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            console.log('getting specific product', id);
            const query = { _id: ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.json(product);
        })

        //Add new product
        app.post('/products', async (req, res) => {
            const newProduct = req.body;
            console.log('hit the post api', newProduct)
            const result = await productCollection.insertOne(newProduct);
            console.log(result);
            res.json(result)

        });
        // Delete a product
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.json(result);
        })

        // get all orders
        app.get('/orders', async (req, res) => {
            const cursor = orderCollection.find({});
            const orders = await cursor.toArray();
            res.send(orders);
        })

        //get specific order
        app.get('/orders/:email', async (req, res) => {
            const result = await orderCollection.find({ email: req.params.email }).toArray();
            res.send(result);
        })



        //Add new order
        app.post('/orders', async (req, res) => {
            const newOrder = req.body;
            console.log('hit the post api', newOrder)
            const result = await orderCollection.insertOne(newOrder);
            console.log(result);
            res.json(result)

        });

        // Add new review
        app.post('/reviews', async (req, res) => {
            const newReview = req.body;
            console.log('hit the post api', newReview)
            const result = await reviewCollection.insertOne(newReview);
            console.log(result);
            res.json(result)

        });

        //Get all reviews
        app.get('/reviews', async (req, res) => {
            const cursor = reviewCollection.find({});
            const reviews = await cursor.toArray();
            res.send(reviews);
        })
        // Delete specific order
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.json(result);
        })
        //Add new user
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log('hit the post api', user)
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result)

        });


        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            console.log(result);
            res.json(result)

        });

        //Verify admin
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }

            }
            else {
                res.status(403).json({ message: 'You do not have access to make Admin' })
            }




        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`server is walking at ${port}`)
})