const express = require('express');
const fileupload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const port = 5000;
const fs = require('fs-extra');

require('dotenv').config()

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.w1mvn.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('services'));
app.use(fileupload());

//database connection
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const serviceCollection = client.db("cretiveAgencyDB").collection("services");
    const userFeedBackCollection = client.db("cretiveAgencyDB").collection("feedback");
    const adminCollection = client.db("cretiveAgencyDB").collection("admins");
    const orderCollection = client.db("cretiveAgencyDB").collection("orders");
    console.log('database connected')

    // add new service in databse
    app.post('/addService', (req, res) => {
        const file = req.files.file;
        const serviceTitle = req.body.serviceTitle;
        const description = req.body.description;
        const filePath = `${__dirname}/services/${file.name}`;
        file.mv(filePath, err => {
            if (err) {
                console.log(err);
                res.status(500).send({ msg: 'Failed to upload image' });
            }
            const newImg = fs.readFileSync(filePath);
            const encImg = newImg.toString('base64');
            const serviceImage = {
                contentType: req.files.file.mimetype,
                size: req.files.file.size,
                img: Buffer(encImg, 'base64')
            };
            serviceCollection.insertOne({ serviceTitle, description, serviceImage })
                .then(result => {
                    fs.remove(filePath, error => {
                        if (error) {
                            console.log(error)
                        }
                        res.send(result.insertedCount > 0)
                    });

                })
        })
    })

    // add order in databse
    app.post('/addOrder', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const email = req.body.email;
        const service = req.body.service;
        const projectDetails = req.body.projectDetails;
        const price = req.body.price;

        const filePath = `${__dirname}/orders/${file.name}`;
        file.mv(filePath, err => {
            if (err) {
                console.log(err);
                res.status(500).send({ msg: 'Failed to upload image' });
            }
            const newImg = fs.readFileSync(filePath);
            const encImg = newImg.toString('base64');
            const projectFile = {
                contentType: req.files.file.mimetype,
                size: req.files.file.size,
                img: Buffer(encImg, 'base64')
            };
            orderCollection.insertOne({ name, email, service, projectDetails, price, projectFile })
                .then(result => {
                    fs.remove(filePath, error => {
                        if (error) {
                            console.log(error)
                        }
                        res.send(result.insertedCount > 0)
                    });

                })
        })
    })


    //add user feedback
    app.post('/addUserFeedback', (req, res) => {
        const feedback = req.body;
        userFeedBackCollection.insertOne(feedback)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })
    // load user feedback from database
    app.get('/loadFeedback', (req, res) => {
        userFeedBackCollection.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })
    })

    // load service data from database
    app.get('/loadService', (req, res) => {
        serviceCollection.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })
    })
    // add admin in database
    app.post('/addAdmin', (req, res) => {
        const admin = req.body;
        adminCollection.insertOne(admin)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    // check admin
    app.post('/checkAdmin', (req, res) => {
        const email = req.body.email;
        adminCollection.find({ email: email })
            .toArray((err, admin) => {
                res.send(admin.length > 0);
            })
    })
    //close db connection
});




app.get('/', function (req, res) {
    res.send('Hey! I am woring properly right now')
})

app.listen(process.env.PORT || port)