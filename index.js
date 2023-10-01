import express from "express";
import path from "path";
import sqlite3 from "sqlite3";
import fetch from "node-fetch";
import {Section} from './public/js/app.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const wledIp = "192.168.3.117";

let numLeds = 0;
fetch("http://"+wledIp+"/json/info")
    .then(res => res.json())
    .then(json => numLeds = json.leds.count);

let getSections = () => {
    return [
        {length: numLeds, reverse: false, mirror: false}
    ]
};

const db = new sqlite3.Database("db.sqlite", (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message);
      throw err;
    } else {
      console.log("Connected to the SQLite database.");
    }
  });

app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/sections", function(req, res) {
    let sections = getSections().map(x => new Section(x.length, x.reverse, x.mirror))
    res.status(200).json(sections)
});

app.listen(8000, () => console.log("Server is running on Port 8000"));