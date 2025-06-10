const express = require('express');
const app = express();
const mongoose = require('mongoose');
const ejs = require('ejs');
const Listing = require("./models/listing.js");
const path = require('path');
const methodOverride = require('method-override');
const ejsmate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema , reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");



const MONGO_URL = "mongodb://127.0.0.1:27017/WanderLust" ;

main().then(()=>{
    console.log("connected to DB");
}).catch(err =>{
    console.log(err);
})
async function main(){
    await mongoose.connect(MONGO_URL);
}

app.engine('ejs', ejsmate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
});

app.get("/" , (req , res)=>{
    res.send("Hello World");
});


const validateListing =(req,res,next)=>{
    let error = listingSchema.validate(req.body);
    if (error){
        let errMsg =  error.details.map((el)=> el.message).join(",") ;
        throw new ExpressError(400,errMsg);
    } else {
        next();
    }
};

const validateReview =(req,res,next)=>{
    let error = reviewSchema.validate(req.body);
    if (error){
        let errMsg =  error.details.map((el)=> el.message).join(",") ;
        throw new ExpressError(400,errMsg);
    } else {
        next();
    }
};

//Index route
app.get("/listings", async(req , res)=>{
    const allListings = await Listing.find({});
    res.render("listings/index", {allListings});
});




//New Route
app.get("/listings/new", (req , res)=>{
    res.render("listings/new");
});

//Show route
app.get("/listings/:id",wrapAsync( async(req , res)=>{
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    console.log(listing);
    res.render("listings/show", {listing});
}));

//Edit Route
app.get("/listings/:id/edit",wrapAsync( async(req , res)=>{
    const { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit", {listing});
}));



//update route
app.put("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, req.body.listing);
    res.redirect("/listings");
})) ;

// Create route
app.post("/listings",validateListing, wrapAsync( async(req, res,next) => {
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    console.log(newListing);
    res.redirect("/listings");
}));


//delete route
app.delete("/listings/:id", wrapAsync( async(req,res)=>{
    let {id} = req.params ;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));


//Reviews
//Post Route
app.post("/listings/:id/reviews",validateReview ,wrapAsync( async (req,res)=> {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);

    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();
    console.log(listing.reviews);
    res.redirect(`/listings/${listing._id}`);
}));





app.all("/*path" , (req,res,next) =>{
    next(new ExpressError(404,"page not found"));
})

app.use((err,req,res,next) => {
    let {statusCode , message} = err ;
    res.render("error.ejs",{message});
    // res.status(statusCode).send(message);
    // res.send("something went wrong!")
})