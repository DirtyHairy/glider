const fs = require('fs');

export const fsh = {
    feature: fs.readFileSync(`${__dirname}/feature.fsh`, 'utf8'),
    imagelayer: fs.readFileSync(`${__dirname}/imagelayer.fsh`, 'utf8')
};

export const vsh = {
    feature: fs.readFileSync(`${__dirname}/feature.vsh`, 'utf8'),
    imagelayer: fs.readFileSync(`${__dirname}/imagelayer.vsh`, 'utf8')
};
