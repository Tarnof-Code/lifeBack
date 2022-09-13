var express = require("express");
var router = express.Router();
var bcrypt = require("bcrypt");

var uid2 = require("uid2");
var userModel = require("../models/users");
var { vaccineModel } = require("../models/vaccines");
var { medicalTestModel } = require("../models/medicalTests");
// var { illnessModel } = require("../models/illnesses");
var { HCProModel } = require("../models/healthcareprofessional");
const { updateOne } = require("../models/users");

/* >>>>>>>>>>>>>>>>>>>>>>>>>>>>>> PROFILSCREEN <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< */
router.get("/profil/:token", async function (req, res) {
  var result = false;
  const user = await userModel.findOne({
    token: req.params.token,
  });
  if (user) {
    result = true
  }
  //Aller chercher les infos des profils ajoutés par le user principal
  var userFamily = await userModel.findOne({ token: user.token }).populate("family").exec();
  res.json({ result, user, userFamily });//Envoyés au Front
});

/* >>>>>>>>>>>>>>>>>>>>>>>>>>>>>> SIGN-UP <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< */
router.post("/sign-up", async function (req, res) {
  var error = [];
  var result = false;
  var saveUser = null;
  var illnessesObjTab = [];
  var familyHistoryObjTab = [];
  var currentUser = null;

  var illnessesTab = req.body.illnessesFromFront.split(",");
  for (let i = 0; i < illnessesTab.length; i++) {
    illnessesObjTab[i] = {
      name: illnessesTab[i],
    };
  }

  var familyHistoryTab = req.body.familyHistoryFromFront.split(",");
  for (let i = 0; i < familyHistoryTab.length; i++) {
    familyHistoryObjTab[i] = {
      name: familyHistoryTab[i],
    };
  }


  const hash = bcrypt.hashSync(req.body.passwordFromFront, 10);

  const data = await userModel.findOne({
    mail: req.body.emailFromFront,
  });

  if (data != null) {
    error.push("utilisateur déjà présent");
  }

  if (
    req.body.usernameFromFront == "" ||
    req.body.emailFromFront == "" ||
    req.body.passwordFromFront == ""
  ) {
    error.push("champs vides");
  }

  if (error.length == 0) {
    var newUser = new userModel({
      mail: req.body.emailFromFront,
      password: hash,
      firstname: req.body.firstnameFromFront,
      lastname: req.body.lastnameFromFront,
      birthdate: req.body.birthdateFromFront,
      sex: req.body.sexFromFront,
      profession: req.body.professionFromFront,
      illnesses: illnessesObjTab,
      familyHistory: familyHistoryObjTab,
      token: uid2(32),
    });

    saveUser = await newUser.save();

    var vaccines = await vaccineModel.find({});
    var medicalTests = await medicalTestModel.find({});
    var newUserAge = Date.now() - newUser.birthdate;


    //Choix des vaccins concernant la personne selon leur age, sexe, profession
    var customizedVaccines = vaccines.filter(function (vaccine) {
      // filtrage par âge
      return (
        (newUserAge >= vaccine.startAge * 31536000000 &&
          newUserAge <= vaccine.endAge * 31536000000) ||
        // filtrage par sexe
        newUser.sex === vaccine.sex ||
        vaccine.sex === "unisex" ||
        // filtrage par profession
        newUser.profession === vaccine.profession
      );
    });

    var customizedMedicalTests = medicalTests.filter(function (medicalTest) {
      // filtrage par âge
      return (
        (newUserAge >= medicalTest.startAge * 31536000000 &&
          newUserAge <= medicalTest.endAge * 31536000000) ||
        // filtrage par sexe
        newUser.sex === medicalTest.sex ||
        medicalTest.sex === "unisex" ||
        // filtrage par profession
        newUser.profession === medicalTest.profession ||
        medicalTest.profession === ""
      );
    });

    if (saveUser) {
      await userModel.updateOne(
        { _id: newUser._id.toString() },
        { vaccines: customizedVaccines, medicalTests: customizedMedicalTests }
      );

      currentUser = await userModel.findOne({
        token: newUser.token,
      });
      result = true;
    }
  }

  res.json({ result, saveUser, error, customizedVaccines, currentUser });
});

/* >>>>>>>>>>>>>>>>>>>>>>>>>>>>>> SIGN-IN <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< */
router.post("/sign-in", async function (req, res, next) {
  var result = false;
  var user = null;
  var error = [];
  console.log(req.body.emailFromFron)
  if (req.body.emailFromFront == "" || req.body.passwordFromFront == "") {
    error.push("champs vides");
  }

  if (error.length == 0) {
    user = await userModel.findOne({
      mail: req.body.emailFromFront,
    });
    if (!user) {
      var token = "";
    } else {
      token = user.token;
    }

    if (user && bcrypt.compareSync(req.body.passwordFromFront, user.password)) {
      result = true;
    } else {
      error.push("email ou mot de passe incorrect");
    }
  }

  res.json({ result, user, error, token });
});



//Route qui permet d'enregistrer en base de données les établissements de santé
router.post("/addhcpro/:token", async function (req, res, next) {
  var newHCPro = new HCProModel({
    profession: req.body.professionFromFront,
    adresse: req.body.adresseFromFront,
    ville: req.body.villeFromFront,
    tel: req.body.telFromFront,
    category: req.body.categoryFromFront,
    secteur: req.body.secteurFromFront,
  });
  saveHCPro = await newHCPro.save();
  console.log("Nouveau professionnel de santé bien ajouté !", saveHCPro);
  let user = await userModel.findOne({ token: req.params.token });
  let result = await userModel.updateOne(
    { token: req.params.token },
    { addressBook: [...user.addressBook, saveHCPro] }
  );

  res.json({ saveHCPro });
});

//Route qui permet de lire en BDD les établissements de santé liés à un compte user
router.get("/readhcpro/:token", async function (req, res, next) {
  let userData = await userModel
    .findOne({ token: req.params.token })
    .populate("addressBook")
    .exec();
  let addB = userData.addressBook;

  res.json({ addB });
});


router.post("/add-profile/:token", async function (req, res) {

  var illnessesObjTab = [];
  var familyHistoryObjTab = []

  if (req.body.illnessesFromFront) {
    var illnessesTab = (req.body.illnessesFromFront).split(',')
    for (let i = 0; i < illnessesTab.length; i++) {
      illnessesObjTab[i] = {
        name: illnessesTab[i]
      }
    }
  }

  if (req.body.familyHistoryFromFront) {
    var familyHistoryTab = (req.body.familyHistoryFromFront).split(",")
    for (let i = 0; i < familyHistoryTab.length; i++) {
      familyHistoryObjTab[i] = {
        name: familyHistoryTab[i]
      }
    }
  }


  const mainUser = await userModel.findOne({ token: req.params.token });

  let saveUser = null;
  let user = await userModel.findOne({
    mail: req.body.emailFromFront
  })


  if (!user) {
    user = new userModel({
      firstname: req.body.firstnameFromFront,
      lastname: req.body.lastnameFromFront,
      birthdate: req.body.birthdateFromFront,
      sex: req.body.sexFromFront,
      profession: req.body.professionFromFront,
      relationship: req.body.relationshipFromFront,
      illnesses: illnessesObjTab,
      familyHistory: familyHistoryObjTab
    })
    saveUser = await user.save()
  }

  var vaccines = await vaccineModel.find({});
  var medicalTests = await medicalTestModel.find({});
  var userAge = Date.now() - user.birthdate;


  // Choix des vaccins concernant la personne selon leur age, sexe, profession

  var customizedVaccines = vaccines.filter(function (vaccine) {
    // filtrage par âge
    return ((userAge >= (vaccine.startAge * 31536000000) && userAge <= (vaccine.endAge * 31536000000)) ||
      // filtrage par sexe
      (user.sex === vaccine.sex || vaccine.sex === 'unisex') ||
      // filtrage par profession
      (user.profession === vaccine.profession));
  })

  var customizedMedicalTests = medicalTests.filter(function (medicalTest) {
    // filtrage par âge
    return ((userAge >= (medicalTest.startAge * 31536000000) && userAge <= (medicalTest.endAge * 31536000000)) ||
      // filtrage par sexe
      (user.sex === medicalTest.sex || medicalTest.sex === 'unisex') ||
      // filtrage par profession
      (user.profession === medicalTest.profession || medicalTest.profession === ''));
  })

  if (saveUser) {

    await userModel.updateOne({ _id: user._id.toString() }, { vaccines: customizedVaccines, medicalTests: customizedMedicalTests });
  }

  let newFamily = mainUser.family;
  if (!mainUser.family.find(element => element === user._id)) {
    newFamily.push(user._id);
  }
  const mainUserUpdated = await userModel.updateOne({ token: req.params.token }, { family: newFamily });

  res.json({ mainUser, user })

});


module.exports = router;
