const Datastore = require("nedb");
const path = require("path");

const messageDB = new Datastore({
  filename: "./db/messages.db",
  autoload: true,
});

messageDB.persistence.setAutocompactionInterval(60 * 1000); // her 1 dakika sıkıştır
// Helper'lar
const insertMessage = (msg) =>
  new Promise((resolve, reject) => {
    messageDB.insert(msg, (err, newMsg) => {
      if (err) return reject(err);
      resolve(newMsg);
    });
  });

const findMessages = (query, sort = null) =>
  new Promise((resolve, reject) => {
    let cursor = messageDB.find(query);
    if (sort) cursor = cursor.sort(sort);
    cursor.exec((err, docs) => {
      if (err) return reject(err);
      resolve(docs);
    });
  });

const updateMessage = (query, update) =>
  new Promise((resolve, reject) => {
    messageDB.update(query, update, {}, (err, numAffected) => {
      if (err) return reject(err);
      resolve(numAffected);
    });
  });

const deleteMessage = async (mesajId) => {
  return new Promise((resolve, reject) => {
    messageDB.remove({ _id: mesajId }, {}, (err, numRemoved) => {
      if (err) return reject(err);
      resolve(numRemoved);
    });
  });
};

const Message = {
  yeniMesaj: async (mesaj) => {
    const yeniMesaj = {
      id: mesaj.id,
      from: mesaj.from,
      to: mesaj.to,
      text: mesaj.text,
      timestamp: mesaj.timestamp,
      delivred: false,
    };
    return await insertMessage(yeniMesaj);
  },

  kullaniciIcinBekleyenMesajlar: async (nickname) => {
    return await findMessages({ to: nickname, delivred: false });
  },

  kullaniciIcinTumMesajlar: async (from, to) => {
    return await findMessages(
      {
        $or: [
          { from, to },
          { from: to, to: from },
        ],
      },
      { timestamp: 1 }
    );
  },

  mesajIletildiOlarakIsaretle: async (mesajId) => {
    return await updateMessage({ _id: mesajId }, { $set: { delivred: true } });
  },

  deleteMessage,
};

module.exports = Message;
