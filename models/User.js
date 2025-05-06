const Datastore = require("nedb");
const bcrypt = require("bcrypt");

const userDB = new Datastore({ filename: "./db/users.db", autoload: true });

// NeDB'yi Promise-wrapped hale getiriyoruz
const findUser = (query) =>
  new Promise((resolve, reject) => {
    userDB.findOne(query, (err, user) => {
      if (err) return reject(err);
      resolve(user);
    });
  });

const insertUser = (doc) =>
  new Promise((resolve, reject) => {
    userDB.insert(doc, (err, newDoc) => {
      if (err) return reject(err);
      resolve(newDoc);
    });
  });

const registerUser = async (nickname, password) => {
  try {
    const existingUser = await findUser({ nickname });
    if (existingUser) {
      return {
        success: false,
        message:
          "Yazdığınız takma ad halihazırda başkası tarafından kullanılıyor",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await insertUser({ nickname, password: hashedPassword });

    return { success: true, user: { nickname: newUser.nickname } };
  } catch (err) {
    console.error("Kayıt hatası:", err);
    return { success: false, message: "Sunucu hatası." };
  }
};

const loginUser = async (nickname, password) => {
  try {
    const user = await findUser({ nickname });
    if (!user) {
      return { success: false, message: "Takma ad yanlış." };
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return { success: false, message: "Şifre yanlış." };
    }

    return { success: true, user: { nickname: user.nickname } };
  } catch (err) {
    console.error("loginUser error:", err);
    return { success: false, message: "Suncu hatası." };
  }
};

module.exports = {
  registerUser,
  loginUser,
};
