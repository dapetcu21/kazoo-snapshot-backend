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
const bodyParser = require('body-parser')

const db = require('../models/index')

const app = express()
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const port = process.env.PORT || 80
const upload = multer()

app.use(cors())
app.options('*', cors())

app.use(bodyParser.json())

const SIMILARITY_TRESHOLD = 3

async function similarImageExists(hash) {
  return false
  // const images = await db.Image.findAll({
  //   attributes: ['hash'],
  // })
  // const distances = await Promise.all(images.map(image => phash.compare(hash, image.hash)))
  // return distances.reduce((a, b) => Math.min(a, b), Infinity) <= SIMILARITY_TRESHOLD;
}

app.post('/upload', upload.array('files', 12), (req, res, cb) => {
  Promise.all(req.files.map(async function (file) {
    const extension = path.extname(file.originalname || 'image.jpg')
    const filename = await mktemp.createFile('XXXXXXXXXXXXXXXXXXXXXX' + extension)

    await fs.writeFile(filename, file.buffer)
    // const hash = await phash.compute(filename)
    const hash = "nohash"
    await fs.unlink(filename)

    if (await similarImageExists(hash)) {
      console.log('File too similar: ' + file.originalname)
    } else {
      const id = uuidv4()
      await db.Image.create({
        id,
        data: file.buffer,
        hash,
        mimeType: file.mimeType || 'image/jpeg',
        used: false,
      })
      io.emit('image_upload', { id, used: false })
    }
  })).then(() => {
    res.json({})
  }, cb)
})

app.get('/image/:id', (req, res, cb) => {
  db.Image.findOne({
    where: { id: req.params.id },
    attributes: ['data', 'mimeType'],
  }).then(image => {
    if (!image) {
      res.status(404).end('Not found')
      return
    }

    if (image.mimeType) {
      res.append('Content-Type', image.mimeType)
    }

    res.end(image.data)
  }, cb)
})

app.patch('/image/:id', (req, res, cb) => {
  (async function () {
    const image = await db.Image.findOne({
      where: { id: req.params.id },
      attributes: ['id', 'used', 'mimeType'],
    })

    if (!image) {
      res.status(404).end('Not found')
      return
    }

    if (typeof req.body.used === 'boolean') {
      image.used = req.body.used
    }

    await image.save()

    res.json({})
  })().catch(cb)
})

app.delete('/image/:id', (req, res, cb) => {
  db.Image.destroy({
    where: { id: req.params.id },
  }).then(() => {
    res.json({})
  }, cb)
})

app.get('/images', (req, res, cb) => {
  db.Image.findAll({
    attributes: ['id', 'used'],
    order: [['createdAt', 'DESC']],
  }).then(data => {
    res.json(data)
  }, cb)
})


app.post('/new_image', (req, res, cb) => {
  (async function () {
    const image = await db.Image.findOne({
      where: { used: false },
      order: [db.Sequelize.literal('random()')],
    })

    if (!image) {
      res.json({})
      return
    }

    image.used = true
    await image.save()

    io.emit('show_image', { id: image.id })
    res.json({ id: image.id })
  })().catch(cb)
})

app.post('/show_image/:id', upload.none(), (req, res, cb) => {
  io.emit('show_image', { id: req.params.id })
})

app.post('/hide_image', (req, res, cb) => {
  io.emit('hide_image')
})

app.post('/show_qr', (req, res, cb) => {
  io.emit('show_qr')
})

http.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
