const express = require('express');
const timeInfo = require('./datetime_en_et');
const fs = require('fs');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res)=>{
    //res.send('See töötab!');
    //res.download('index.js');
    res.render('index');
})

app.get('/timenow', (req, res)=>{
    const dateNow = timeInfo.dateETformatted();
    const timeNow = timeInfo.timeETformatted();
    //res.render('timenow');
    res.render('timenow', {nowD: dateNow, nowT: timeNow});
})

app.get('/wisdom', (req, res)=>{
    let folkWisdom = [];
    fs.readFile('public/txtfiles/vanasonad.txt', 'utf8', (err, data)=>{
        if(err){
            throw err;
        }
        else {
            folkWisdom = data.split(';');
            res.render('justlist', {h1: 'Vanasõnad', wisdom: folkWisdom});
        }
    });
})

app.get('/names', (req, res)=>{
    let peopleNames = [];
    fs.readFile('public/txtfiles/log.txt', 'utf8', (err, data)=>{
        if(err){
            throw err;
        }
        else {
            peopleNames = data.replaceAll(',', ' ').split(';');
            res.render('namelist', {h1: 'Nimed', names: peopleNames});
        }
    });
})

app.listen(5110);