const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
const port = 5000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: "SaveASecret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/coldstoreDB", { useNewUrlParser: true, useUnifiedTopology: true });

// mongoose.connect("mongodb+srv://admin-leonddarko:AdminTheOptimist91@webappcluster0.4hdq0.mongodb.net/thecoldstoreDB", { useNewUrlParser: true, useUnifiedTopology: true });


const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  name: String,
  role: String,
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);


const productSchema = new mongoose.Schema({
  productName: String,
  productDesc: String,
  productPrice: String,
});

const Product = mongoose.model("Product", productSchema);


const BranchSchema = new mongoose.Schema({
  branchName: String,
  branchAddress: String,
  branchNumber: String,
});

const Branch = new mongoose.model("Branch", BranchSchema);


passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.route("/")
  .get((req, res) => {
    res.render("signin", {
      pageTitle: "Signin",
      emailError: "",
      wrongPswerror: "",
    });
  })
  .post((req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    const user = new User({
      username: username,
      password: password,
    });

    req.login(user, (error) => {
      if (error) {
        console.log(error);
        // res.render("signin", {
        //   pageTitle: "Signin",
        //   emailError: "(!) Couldn't find this email",
        //   wrongPswerror: "Wrong password! Try again.",
        // });
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/home");
        });
      }
    })

  });


app.route("/home")
  .get((req, res) => {

    if (req.isAuthenticated()) {
      res.render("home", {
        pageTitle: "Signin",
      });
    } else {
      res.redirect("/");
    }

  });


app.route("/sales")
  .get((req, res) => {

    if (req.isAuthenticated()) {
      res.render("sales", {
        pageTitle: "Sales",
      });
    } else {
      res.redirect("/");
    }

  });


app.route("/products")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      Product.find({}, (error, foundProducts) => {
        res.render("products", {
          pageTitle: "Products",
          products: foundProducts,
        });
      });
    } else {
      res.redirect("/");
    }
  })
  .post((req, res) => {

    const ProductName = req.body.productname;
    const ProductDesc = req.body.productdesc;
    const ProductPrice = req.body.productprice;
    const btn = req.body.btn;
    const ProductID = req.body.productID;

    if (btn === "addproduct") {
      const newProduct = new Product({
        productName: ProductName,
        productDesc: ProductDesc,
        productPrice: ProductPrice,
      });

      newProduct.save((error) => {
        if (!error) {
          console.log("New Product Successfully Saved!");
          res.redirect("/products");
        } else {
          console.log(error);
        }
      });

    } else if (btn === "deleteproduct") {
      // console.log(req.body);
      Product.findByIdAndRemove({ _id: ProductID }, (error) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Product successfully removed from document");
        }
        res.redirect("/products");
      });
    } else if (btn === "editproduct") {
      // console.log(ProductID, ProductName, ProductDesc, ProductPrice);
      Product.findByIdAndUpdate({ _id: ProductID },
        { productName: ProductName, productDesc: ProductDesc, productPrice: ProductPrice }, (error) => {
          if (!error) {
            console.log("Product updates successful :) on ID" + ProductID);
            res.redirect("/products")
          } else {
            console.log(error);
          }
        });
    }

  });


app.route("/users")
  .get((req, res) => {

    if (req.isAuthenticated()) {

      User.find({}, (error, foundUsers) => {
        if (!error) {
          res.render("users", {
            pageTitle: "Users",
            Users: foundUsers,
          });
        } else {
          console.log(error);
        }
      });

    } else {
      res.redirect("/");
    }

  })
  .post((req, res) => {
    const button = req.body.btn;
    const Name = req.body.name;
    const Username = req.body.username;
    const Role = req.body.role;
    const password = req.body.password;
    const userID = req.body.userID;


    if (button === "adduser") {

      User.register({ username: Username, name: Name, role: Role }, password, (error, user) => {
        if (error) {
          console.log(error);
          res.redirect("/users");
        } else {
          passport.authenticate("local")(req, res, () => {
            res.redirect("/users");
          });
        }
      });

    } else if (button === "deleteuser") {
      User.findByIdAndRemove({ _id: userID }, (error) => {
        if (!error) {
          res.redirect("/users");
        }
      });
    } else if (button === "edituser") {
      console.log(userID, Name, Username, Role);
      User.findByIdAndUpdate({ _id: userID },
        { username: Username, name: Name, role: Role }, (error) => {
          if (!error) {
            console.log("User updates successful :) on ID" + userID);
            res.redirect("/users")
          } else {
            console.log(error);
          }
        });
    }

  });


app.route("/branches")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      Branch.find({}, (error, foundBranches) => {
        if (!error) {
          res.render("branches", {
            pageTitle: "Branches",
            Branches: foundBranches,
          });
        } else {
          console.log(error);
        }
      });
    } else {
      res.redirect("/");
    }

  })
  .post((req, res) => {
    const button = req.body.btn;
    const BranchName = req.body.branchname;
    const BranchAddress = req.body.branchaddress;
    const BranchNumber = req.body.branchnumber;
    const BranchID = req.body.branchID;

    if (button === "addbranch") {
      const newBranch = new Branch({
        branchName: BranchName,
        branchAddress: BranchAddress,
        branchNumber: BranchNumber,
      });

      newBranch.save((error) => {
        if (!error) {
          console.log("Branch added successfully!");
          res.redirect("/branches");
        } else {
          console.log(error);
        }
      });
    } else if (button === "deletebranch"){

      console.log(req.body);
      Branch.findByIdAndRemove({ _id: BranchID }, (error) => {
        if (!error) {
          res.redirect("/branches");
        }
      });
    } else if (button === "editbranch"){
      console.log(req.body);
      Branch.findByIdAndUpdate({ _id: BranchID },
        { branchName: BranchName, branchAddress: BranchAddress, branchNumber: BranchNumber }, (error) => {
          if (!error) {
            console.log("Branch updates successful :) on ID" + BranchID);
            res.redirect("/branches")
          } else {
            console.log(error);
          }
        });
    }

  });


app.route("/logout")
  .get((req, res) => {
    req.logout((error) => {
      if (error) {
        console.log(error);
      }
    });
    res.redirect("/");
  });


app.listen(port, () => {
  console.log(`Application running on http://localhost:${port}`);
});


