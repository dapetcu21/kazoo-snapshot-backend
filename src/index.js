#!/usr/bin/env node

require('dotenv').config()

const express = require('express')
const cors = require('cors')
const multer = require('multer')
const fs = require('fs').promises
const phash = require('phash-im')
const path = require('path')
const mktemp = require('mktemp')
const uuidv4 = require('uuid/v4')

const db = require('../models/index')

const app = express()
const port = process.env.PORT || 80
const upload = multer()

app.use(cors())

const SIMILARITY_TRESHOLD = 3

async function similarImageExists(hash) {
  const images = await db.Image.findAll({
    attributes: ['hash'],
  })
  const distances = await Promise.all(images.map(image => phash.compare(hash, image.hash)))
  return distances.reduce(Math.min, Infinity) <= SIMILARITY_TRESHOLD;
}

app.post('/upload', upload.array('files', 12), (req, res, cb) => {
  Promise.all(req.files.map(async function (file) {
    const extension = path.extname(file.originalname || 'image.jpg')
    const filename = await mktemp.createFile('XXXXXXXXXXXXXXXXXXXXXX' + extension)

    await fs.writeFile(filename, file.buffer)
    const hash = await phash.compute(filename)
    await fs.unlink(filename)

    if (await similarImageExists(hash)) {
      console.log('File too similar: ' + file.originalname)
    } else {
      await db.Image.create({
        id: uuidv4(),
        data: file.buffer,
        hash: hash,
        mimeType: file.mimeType || 'image/jpeg',
        used: false,
      })
    }
  })).then(() => {
    res.json({})
  }, (err) => {
    cb(err)
  })
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
